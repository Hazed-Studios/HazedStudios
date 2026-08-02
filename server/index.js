const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up MSSQL configuration
// Using explicit ODBC connection string for Windows Authentication as fallback
const sqlConfig = {
  connectionString: process.env.VITE_MSSQL_CONNECTION_STRING || process.env.DATABASE_URL || 'Driver={SQL Server};Server=localhost,1433;Database=hazedstudios;Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;'
};

// Route: Get Stock for a Product
app.get('/api/stock/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('productId', sql.Int, productId)
      .query('SELECT SUM(quantity) as total FROM product_stock WHERE product_id = @productId');
    
    res.json({ quantity: result.recordset[0]?.total || 0 });
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ error: 'Failed to fetch stock', details: err.message });
  }
});

// Route: Create Checkout Order
app.post('/api/checkout', async (req, res) => {
  try {
    const { customer, cart, total } = req.body;
    
    // Connect to database
    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // 1. Create or get customer
      request.input('phone', sql.NVarChar, customer.phone);
      let customerResult = await request.query('SELECT id FROM customers WHERE phone = @phone');
      let customerId;

      if (customerResult.recordset.length > 0) {
        customerId = customerResult.recordset[0].id;
      } else {
        request.input('name', sql.NVarChar, customer.name);
        request.input('email', sql.NVarChar, customer.email);
        request.input('governorate', sql.NVarChar, customer.governorate);
        
        const insertCustomer = await request.query(`
          INSERT INTO customers (name, phone, email, governorate)
          OUTPUT INSERTED.id
          VALUES (@name, @phone, @email, @governorate)
        `);
        customerId = insertCustomer.recordset[0].id;
      }

      // 2. Process each cart item
      let firstOrderId = 0;
      for (const item of cart) {
        const qty = item.quantity || 1;
        const sizeString = `${item.quantity || 1}x ${item.size} (${item.color})`;
        const sizeColorStr = `${item.size} - ${item.color}`;
        
        // Insert order
        const reqOrder = new sql.Request(transaction);
        reqOrder.input('customerId', sql.Int, customerId);
        reqOrder.input('productId', sql.Int, item.id);
        reqOrder.input('size', sql.NVarChar, sizeString);
        reqOrder.input('address', sql.NVarChar, customer.address);
        reqOrder.input('governorate', sql.NVarChar, customer.governorate);
        reqOrder.input('totalPrice', sql.Decimal(18, 2), item.price * qty);
        reqOrder.input('status', sql.NVarChar, 'Pending');
        
        const insertOrder = await reqOrder.query(`
          INSERT INTO orders (customer_id, product_id, size, address, governorate, total_price, status)
          OUTPUT INSERTED.id
          VALUES (@customerId, @productId, @size, @address, @governorate, @totalPrice, @status)
        `);
        
        if (firstOrderId === 0 && insertOrder.recordset.length > 0) {
          firstOrderId = insertOrder.recordset[0].id;
        }

        // Check stock
        const reqStock = new sql.Request(transaction);
        reqStock.input('productId', sql.Int, item.id);
        reqStock.input('sizeColor', sql.NVarChar, sizeColorStr);
        
        const stockResult = await reqStock.query(`
          SELECT quantity FROM product_stock WHERE product_id = @productId AND size = @sizeColor
        `);

        if (stockResult.recordset.length > 0 && stockResult.recordset[0].quantity >= qty) {
          // Deduct stock
          const reqUpdateStock = new sql.Request(transaction);
          reqUpdateStock.input('qty', sql.Int, qty);
          reqUpdateStock.input('productId', sql.Int, item.id);
          reqUpdateStock.input('sizeColor', sql.NVarChar, sizeColorStr);
          
          await reqUpdateStock.query(`
            UPDATE product_stock 
            SET quantity = quantity - @qty 
            WHERE product_id = @productId AND size = @sizeColor
          `);
        }
      }

      await transaction.commit();
      res.json({ success: true, orderId: firstOrderId });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Order failed to process' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
