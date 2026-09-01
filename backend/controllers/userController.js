const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const demoController = require('./demoController');

const getUserProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, spay_id, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    return demoController.getProfile(req, res);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (!name && !phone) {
      return res.status(400).json({ message: 'No profile changes provided' });
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }

    values.push(req.user.id);

    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    return demoController.updateProfile(req, res);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password);

    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    return demoController.changePassword(req, res);
  }
};

const getPreferences = async (req, res) => {
  return demoController.getPreferences(req, res);
};

const updatePreferences = async (req, res) => {
  return demoController.updatePreferences(req, res);
};

const getLoginActivity = async (req, res) => {
  return demoController.getLoginActivity(req, res);
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  getLoginActivity
};
