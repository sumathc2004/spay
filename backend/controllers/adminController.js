const pool = require('../config/db');
const demoController = require('./demoController');

const getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, spay_id, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    return demoController.getAllUsers(req, res);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, s.name AS sender_name, r.name AS receiver_name
       FROM transactions t
       LEFT JOIN users s ON t.sender_id = s.id
       LEFT JOIN users r ON t.receiver_id = r.id
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    return demoController.getAllTransactions(req, res);
  }
};

const getStatistics = async (req, res, next) => {
  try {
    const [[userCount]] = await pool.execute('SELECT COUNT(*) AS total_users FROM users');
    const [[activeUsers]] = await pool.execute('SELECT COUNT(*) AS active_users FROM users WHERE role = "user"');
    const [[transactionCount]] = await pool.execute('SELECT COUNT(*) AS total_transactions FROM transactions');
    const [[volume]] = await pool.execute('SELECT COALESCE(SUM(amount), 0) AS total_volume FROM transactions WHERE status = "success"');

    res.json({
      totalUsers: userCount.total_users,
      activeUsers: activeUsers.active_users,
      totalTransactions: transactionCount.total_transactions,
      totalTransactionVolume: Number(volume.total_volume || 0),
    });
  } catch (error) {
    return demoController.getStatistics(req, res);
  }
};

module.exports = { getAllUsers, getAllTransactions, getStatistics };
