const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const generateSpayId = require('../utils/generateSpayId');
const demoController = require('./demoController');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? OR phone = ?', [normalizedEmail, phone]);

    if (existing.length) {
      return res.status(400).json({ message: 'User already exists with this email or phone number' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let spayId = generateSpayId();

    while (true) {
      const [result] = await pool.execute('SELECT id FROM users WHERE spay_id = ?', [spayId]);
      if (!result.length) break;
      spayId = generateSpayId();
    }

    const [userResult] = await pool.execute(
      'INSERT INTO users (name, email, phone, spay_id, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, normalizedEmail, phone, spayId, hashedPassword, 'user']
    );

    const userId = userResult.insertId;
    await pool.execute('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, 0]);

    res.status(201).json({
      message: 'User registered successfully. Please log in.',
      user: { id: userId, name, email: normalizedEmail, phone, spay_id: spayId },
    });
  } catch (error) {
    // Fallback to demo mode if database connection fails
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.message.includes('Access denied')) {
      console.log('⚠️  Database unavailable, using DEMO MODE');
      return demoController.registerUser(req, res);
    }
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        spay_id: user.spay_id,
        role: user.role,
      },
    });
  } catch (error) {
    // Fallback to demo mode if database connection fails
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.message.includes('Access denied')) {
      console.log('⚠️  Database unavailable, using DEMO MODE');
      return demoController.loginUser(req, res);
    }
    next(error);
  }
};

const getProfile = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, spay_id, role, created_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(rows[0]);
};

const logoutUser = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
};
