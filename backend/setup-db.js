const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  const envPwd = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const passwords = [
    'Suman@123',
    envPwd,
    'suman@123',
    '12345678',
    '123456',
    '1234',
    '',
    'root',
    'password',
    'mysql',
    'admin',
    'root123'
  ];

  const uniquePasswords = [...new Set(passwords)];

  let connection = null;
  let workingPassword = null;

  for (const pwd of uniquePasswords) {
    try {
      console.log(`Trying to connect with password: "${pwd ? '******' : '(empty)'}"`);
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: pwd,
        multipleStatements: true,
      });
      workingPassword = pwd;
      console.log('✅ Connected to MySQL successfully!\n');
      break;
    } catch (err) {
      if (pwd === uniquePasswords[uniquePasswords.length - 1]) {
        console.error('\n❌ Could not connect with tested passwords.');
        console.error('Please set DB_PASSWORD in backend/.env with your MySQL root password and run again.');
        process.exit(1);
      }
    }
  }

  try {
    console.log('Creating database: spay_db...');
    await connection.query('CREATE DATABASE IF NOT EXISTS spay_db');
    console.log('✅ Database created/exists: spay_db');

    await connection.query('USE spay_db');
    console.log('✅ Using database: spay_db');

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
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Insert demo user
    console.log('\nSetting up demo user...');
    const email = 'sumathc2004@gmail.com';
    const password = 'Suman@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const spayId = 'SPAY' + Math.random().toString(36).substring(2, 9).toUpperCase();

    try {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, phone, spay_id, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['Suman', email, '9876543210', spayId, hashedPassword, 'admin']
      );
      const userId = result.insertId;
      await connection.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, 25000]);

      console.log(`\n✅ Demo account initialized in MySQL!`);
      console.log(`   📧 Email: ${email}`);
      console.log(`   🔐 Password: ${password}`);
      console.log(`   💳 SPay ID: ${spayId}`);
      console.log(`   💰 Balance: ₹25,000`);
    } catch (userError) {
      if (userError.code === 'ER_DUP_ENTRY') {
        console.log(`   ℹ️  Demo user already exists in database.`);
      } else {
        throw userError;
      }
    }

    await connection.end();

    // Update .env with working password
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${workingPassword}`);
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Updated backend/.env with DB_PASSWORD=${workingPassword}`);

    console.log('\n🎉 Real MySQL Database setup completed 100% successfully!');
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
}

setupDatabase();
