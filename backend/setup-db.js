const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  console.log('Connecting to MySQL database...');

  const dbConfig = process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      };

  let connection = null;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL successfully!\n');
  } catch (err) {
    console.error('❌ Failed to connect to MySQL database:', err.message);
    console.error('\n👉 Please make sure your .env has valid DB credentials:');
    console.error('   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT');
    process.exit(1);
  }

  try {
    const dbName = process.env.DB_NAME || 'spay_db';

    console.log(`Creating database: ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database ready: ${dbName}`);

    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Using database: ${dbName}`);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(15) UNIQUE,
        spay_id VARCHAR(30) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create wallets table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        balance DECIMAL(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(50) UNIQUE,
        sender_id INT,
        receiver_id INT,
        amount DECIMAL(12,2) NOT NULL,
        transaction_type ENUM('sent', 'received', 'added') NOT NULL,
        status ENUM('success', 'pending', 'failed') DEFAULT 'success',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `);

    console.log('✅ Tables created successfully!');

    // Verify tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n✅ Tables verified:');
    tables.forEach((table) => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    await connection.end();
    console.log('\n🎉 MySQL Database setup completed 100% successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
}

setupDatabase();
