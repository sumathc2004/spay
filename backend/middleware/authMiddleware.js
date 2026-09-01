const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { mockUsers } = require('../demo-data');

const JWT_SECRET = process.env.JWT_SECRET || 'spay_demo_secret_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Try MySQL first
    try {
      const [rows] = await pool.execute('SELECT id, name, email, phone, spay_id, role FROM users WHERE id = ?', [decoded.id]);
      if (rows && rows.length) {
        req.user = rows[0];
        return next();
      }
    } catch (dbErr) {
      // Fallback to in-memory demo data
    }

    // Fallback to mock users
    const mockUser = Object.values(mockUsers).find((u) => u.id === decoded.id);
    if (mockUser) {
      req.user = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        spay_id: mockUser.spay_id,
        role: mockUser.role || 'user',
      };
      return next();
    }

    return res.status(401).json({ message: 'User not found' });
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = protect;
