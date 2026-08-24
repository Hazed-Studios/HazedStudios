const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // Set security HTTP headers
app.use(hpp()); // Prevent HTTP Parameter Pollution

// CORS Configuration - Only allow specific origins in production
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000', process.env.VITE_APP_URL];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Body parser with 10kb limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global Rate Limiting - Limit each IP to 100 requests per 15 mins
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again in 15 minutes'
});
app.use('/api', globalLimiter);

// Strict Rate Limiting for sensitive routes (e.g. contact form, checkout)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per hour
  message: 'Too many requests. Please try again later.'
});

// Set up memory storage for attachments
const upload = multer({ storage: multer.memoryStorage() });

// Set up MySQL pool
// Use DATABASE_URL or standard local credentials
const pool = mysql.createPool(
  process.env.DATABASE_URL || {
    host: 'localhost',
    user: 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: 'hazedstudios',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }
);

// Route: Get Stock for a Product
app.get('/api/stock/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await pool.execute(
      'SELECT SUM(quantity) as total FROM product_stock WHERE product_id = ?',
      [productId]
    );

    res.json({ quantity: rows[0]?.total || 0 });
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ error: 'Failed to fetch stock', details: err.message });
  }
});

// Route: Create Checkout Order
app.post('/api/checkout', strictLimiter, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { customer, cart, total } = req.body;

    await connection.beginTransaction();

    // 1. Create or get customer
    const [customerResult] = await connection.execute(
      'SELECT id FROM customers WHERE phone = ?',
      [customer.phone]
    );

    let customerId;

    if (customerResult.length > 0) {
      customerId = customerResult[0].id;
    } else {
      const [insertCustomer] = await connection.execute(
        'INSERT INTO customers (name, phone, email, governorate) VALUES (?, ?, ?, ?)',
        [customer.name, customer.phone, customer.email, customer.governorate]
      );
      customerId = insertCustomer.insertId;
    }

    // 2. Process each cart item
    let firstOrderId = 0;
    for (const item of cart) {
      const qty = item.quantity || 1;
      const sizeString = `${item.quantity || 1}x ${item.size} (${item.color})`;
      const sizeColorStr = `${item.size} - ${item.color}`;
      const totalPrice = item.price * qty;

      // Insert order
      const [insertOrder] = await connection.execute(
        'INSERT INTO orders (customer_id, product_id, size, address, governorate, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [customerId, item.id, sizeString, customer.address, customer.governorate, totalPrice, 'Pending']
      );

      if (firstOrderId === 0 && insertOrder.insertId) {
        firstOrderId = insertOrder.insertId;
      }

      // Check stock
      const [stockResult] = await connection.execute(
        'SELECT quantity FROM product_stock WHERE product_id = ? AND size = ?',
        [item.id, sizeColorStr]
      );

      if (stockResult.length > 0 && stockResult[0].quantity >= qty) {
        // Deduct stock
        await connection.execute(
          'UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ? AND size = ?',
          [qty, item.id, sizeColorStr]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, orderId: firstOrderId });
  } catch (err) {
    await connection.rollback();
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Order failed to process' });
  } finally {
    connection.release();
  }
});

// Route: Admin Data Fetch
app.post('/api/admin/data', async (req, res) => {
  const { password, action } = req.body;
  if (password !== process.env.VITE_ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (action === 'getOrders') {
      const [orders] = await pool.execute(`
        SELECT 
          o.id, o.size, o.address, o.governorate, o.total_price, o.status, o.created_at,
          c.name as customer_name, c.phone as customer_phone
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC
      `);

      const formattedOrders = orders.map(o => ({
        id: o.id,
        size: o.size,
        address: o.address,
        governorate: o.governorate,
        total_price: o.total_price,
        status: o.status,
        created_at: o.created_at,
        customers: {
          name: o.customer_name,
          phone: o.customer_phone
        },
        products: {
          name: 'The Polo Linen Shirt'
        }
      }));

      res.json({ data: formattedOrders });
    } else if (action === 'getCustomers') {
      const [customers] = await pool.execute('SELECT * FROM customers ORDER BY created_at DESC');
      res.json({ data: customers });
    } else if (action === 'getStock') {
      const [stock] = await pool.execute(`
        SELECT ps.*, p.name as product_name 
        FROM product_stock ps 
        LEFT JOIN (SELECT 1 as id, 'The Polo Linen Shirt' as name) p ON ps.product_id = p.id
        ORDER BY ps.size ASC
      `);
      res.json({ data: stock });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('Admin API error:', err);
    res.status(500).json({ error: 'Failed to fetch admin data' });
  }
});

// Route: Contact Form with Attachment
app.post('/api/contact', strictLimiter, upload.single('Attachment'), async (req, res) => {
  const { Name, Email, Message, InquiryType, OrderID } = req.body || {};
  const file = req.file;

  if (!Name || !Email || !Message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'hazed.co.hr@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    const inquiryLabel = InquiryType ? InquiryType.charAt(0).toUpperCase() + InquiryType.slice(1) : 'General';
    const orderIdHtml = OrderID ? `<p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Order ID:</strong> <br/>${OrderID}</p>` : '';

    const mailOptions = {
      from: `"${Name}" <hazed.co.hr@gmail.com>`,
      to: 'hazed.co.hr@gmail.com',
      subject: `New ${inquiryLabel} Inquiry from ${Name}`,
      html: `
        <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid rgba(192, 127, 69, 0.2); border-radius: 8px; background-color: #faf6f0; color: #1a1208;">
          <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; margin-top: 0; margin-bottom: 24px; color: #1a1208; border-bottom: 1px solid rgba(192, 127, 69, 0.2); padding-bottom: 12px;">
            New ${inquiryLabel} Inquiry
          </h2>
          <div style="margin-bottom: 24px;">
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Inquiry Type:</strong> <br/>${inquiryLabel}</p>
            ${orderIdHtml}
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Name:</strong> <br/>${Name}</p>
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Email:</strong> <br/><a href="mailto:${Email}" style="color: #C07F45; text-decoration: none;">${Email}</a></p>
          </div>
          <div style="background-color: #f2ebe0; border-left: 3px solid #C07F45; padding: 16px; border-radius: 4px;">
            <strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; display: block; margin-bottom: 8px;">Message:</strong>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${Message}</p>
          </div>
        </div>
      `,
      replyTo: Email
    };

    if (file) {
      mailOptions.attachments = [
        {
          filename: file.originalname,
          content: file.buffer
        }
      ];
    }

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact email error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Route: Purchase Order Email
app.post('/api/purchase-email', async (req, res) => {
  console.log('--- Received Purchase Email Request ---');
  console.log(req.body);
  const { Order_ID, Customer_Name, Customer_Email, Phone, Governorate, Address, Products, Sizes, Colors, Total, Payment_Method } = req.body;

  if (!Customer_Name || !Products) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'hazed.co.hr@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"${Customer_Name}" <hazed.co.hr@gmail.com>`,
      to: 'hazed.co.hr@gmail.com',
      subject: `New Purchase Order #${Order_ID || 'New'} from ${Customer_Name}`,
      html: `
        <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid rgba(192, 127, 69, 0.2); border-radius: 8px; background-color: #faf6f0; color: #1a1208;">
          <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; margin-top: 0; margin-bottom: 24px; color: #1a1208; border-bottom: 1px solid rgba(192, 127, 69, 0.2); padding-bottom: 12px;">
            New Purchase Order #${Order_ID || ''}
          </h2>
          <div style="background-color: #f2ebe0; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Customer Name:</strong> ${Customer_Name}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Email:</strong> ${Customer_Email || '-'}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Phone:</strong> ${Phone}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Governorate:</strong> ${Governorate}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Address:</strong> ${Address}</p>
          </div>
          <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; color: #C07F45; margin-bottom: 12px;">Order Details</h3>
          <div style="border-left: 3px solid #C07F45; padding-left: 12px; margin-bottom: 24px;">
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Products:</strong> ${Products}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Sizes:</strong> ${Sizes}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Colors:</strong> ${Colors}</p>
          </div>
          <div style="border-top: 1px solid rgba(192, 127, 69, 0.2); padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; display: block;">Payment Method:</strong>
              <span style="font-size: 14px; font-weight: 600;">${Payment_Method}</span>
            </div>
            <div style="text-align: right;">
              <strong style="color: #C07F45; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; display: block;">Total Amount:</strong>
              <span style="font-family: 'Times New Roman', Times, serif; font-size: 24px; color: #1a1208; font-weight: bold;">${Total}</span>
            </div>
          </div>
        </div>
      `,
      replyTo: Customer_Email
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Purchase email sent successfully.' });
  } catch (err) {
    console.error('Purchase email error:', err);
    res.status(500).json({ error: 'Failed to send purchase email.' });
  }
});

// Route: Flottex Shipping API Integration
app.post('/api/shipping/flottex', async (req, res) => {
  console.log('--- Received Flottex API Request ---');
  console.log(req.body);

  const { customerName, phone, address, governorate, products, orderId, price, paymentMethod } = req.body;

  if (!customerName || !phone || !address || !governorate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // If the customer pays with InstaPay, the shipping company should collect 0 EGP (Prepaid)
  const isPrepaid = paymentMethod === 'InstaPay';
  const finalCodAmount = isPrepaid ? 0 : price;
  const flottexPaymentTypeCode = isPrepaid ? "CASH" : "COLC";

  try {
    // Check for flottex credentials in env
    if (!process.env.FLOTTEX_USERNAME || !process.env.FLOTTEX_PASSWORD) {
      throw new Error('Flottex API credentials missing from environment variables');
    }

    const flottexApiUrl = 'https://flottex.lg.accuratess.com:8443/graphql';
    
    // 1. Authenticate with Flottex
    const loginQuery = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
        }
      }
    `;

    const loginVariables = {
      input: {
        username: process.env.FLOTTEX_USERNAME,
        password: process.env.FLOTTEX_PASSWORD
      }
    };

    const loginRes = await fetch(flottexApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: loginQuery, variables: loginVariables }),
    });

    const loginData = await loginRes.json();
    if (loginData.errors || !loginData.data?.login?.token) {
      console.error('Flottex authentication failed:', loginData.errors || loginData);
      return res.status(401).json({ error: 'Flottex authentication failed' });
    }

    const token = loginData.data.login.token;

    // 2. Create Shipment
    const createShipmentMutation = `
      mutation CreateShipment($input: ShipmentInput!) {
        saveShipment(input: $input) {
          id
          trackingUrl
        }
      }
    `;

    const variables = {
      input: {
        recipientName: customerName,
        recipientMobile: phone,
        recipientAddress: address,
        // TODO: Map string governorate to correct Flottex Zone and Subzone IDs
        recipientZoneId: 1, 
        recipientSubzoneId: 1,
        description: products,
        price: finalCodAmount, // 0 if InstaPay, full price if COD
        refNumber: `ORDER-${orderId}`,
        serviceId: 1, // Default service ID (e.g. Next Day Delivery)
        weight: 1.0,
        piecesCount: 1,
        typeCode: "FDP",
        priceTypeCode: "INCLD",
        paymentTypeCode: flottexPaymentTypeCode,
        openableCode: "N"
      }
    };

    const shipmentRes = await fetch(flottexApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        query: createShipmentMutation,
        variables 
      })
    });

    const shipmentData = await shipmentRes.json();

    if (shipmentData.errors) {
      console.error('Flottex create shipment error:', JSON.stringify(shipmentData.errors, null, 2));
      return res.status(500).json({ error: 'Failed to create Flottex shipment', details: shipmentData.errors });
    }

    res.json({ success: true, shipment: shipmentData.data.saveShipment });

  } catch (err) {
    console.error('Flottex API error:', err);
    res.status(500).json({ error: 'Internal server error while calling Flottex' });
  }
});

// Route: Vercel Web Analytics Fetch Detailed
app.post('/api/admin/analytics/detailed', async (req, res) => {
  const { password } = req.body;
  if (password !== process.env.VITE_ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) {
    return res.status(400).json({ error: 'Vercel Analytics not configured' });
  }

  try {
    const fetchVercel = async (endpoint, query = '', type = 'visits') => {
      // Fetch data for the last 30 days
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 30);
      const since = sinceDate.toISOString();
      const until = new Date().toISOString();
      
      let q = `since=${since}&until=${until}`;
      if (query) q += `&${query}`;

      const response = await fetch(`https://api.vercel.com/v1/query/web-analytics/${type}/${endpoint}?projectId=${process.env.VERCEL_PROJECT_ID}&${q}`, {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
        }
      });
      const res = await response.json();
      // the vercel api puts the actual payload in `.data`
      // if there's an error (e.g. no data), we return an empty array or object as a fallback
      return res.data || (res.error ? [] : res);
    };

    const [
      countData,
      countryData,
      referrerData,
      pageData,
      deviceData,
      browserData,
      osData,
      eventsData
    ] = await Promise.all([
      fetchVercel('count'),
      fetchVercel('aggregate', 'by=country'),
      fetchVercel('aggregate', 'by=referrerHostname'),
      fetchVercel('aggregate', 'by=requestPath'),
      fetchVercel('aggregate', 'by=deviceType'),
      fetchVercel('aggregate', 'by=browserName'),
      fetchVercel('aggregate', 'by=osName'),
      fetchVercel('aggregate', 'by=eventName', 'events')
    ]);

    res.json({
      data: {
        count: countData,
        countries: countryData,
        referrers: referrerData,
        pages: pageData,
        devices: deviceData,
        browsers: browserData,
        os: osData,
        events: eventsData
      }
    });
  } catch (err) {
    console.error('Vercel API error:', err);
    res.status(500).json({ error: 'Failed to fetch detailed analytics' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port} using MySQL`);
});
