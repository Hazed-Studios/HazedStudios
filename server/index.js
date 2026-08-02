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
  const { Name, Email, Message } = req.body;
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

    const mailOptions = {
      from: 'hazed.co.hr@gmail.com',
      to: 'hazed.co.hr@gmail.com',
      subject: `New Contact Inquiry from ${Name}`,
      text: `Name: ${Name}\nEmail: ${Email}\n\nMessage:\n${Message}`,
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
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port} using MySQL`);
});
