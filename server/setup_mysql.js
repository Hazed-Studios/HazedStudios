const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function setupDatabase() {
  // First connect without database to create it
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.MYSQL_PASSWORD || ''
  });

  try {
    console.log('Creating hazedstudios database...');
    await connection.query('CREATE DATABASE IF NOT EXISTS hazedstudios');
    await connection.query('USE hazedstudios');

    console.log('Creating customers table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        governorate VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating orders table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        product_id INT NOT NULL,
        size VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        governorate VARCHAR(100) NOT NULL,
        total_price DECIMAL(18,2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    console.log('Creating product_stock table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        size VARCHAR(100) NOT NULL,
        quantity INT NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_product_size (product_id, size)
      )
    `);

    console.log('Inserting initial stock...');
    // We use INSERT IGNORE to prevent duplicate errors on re-run
    const stockData = [
      [1, 'S - Natural Linen', 20],
      [1, 'M - Natural Linen', 20],
      [1, 'L - Natural Linen', 10],
      [1, 'S - Baby Blue', 20],
      [1, 'M - Baby Blue', 20],
      [1, 'L - Baby Blue', 10]
    ];

    for (const [productId, size, quantity] of stockData) {
      await connection.execute(`
        INSERT INTO product_stock (product_id, size, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
      `, [productId, size, quantity]);
    }

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await connection.end();
  }
}

setupDatabase();
