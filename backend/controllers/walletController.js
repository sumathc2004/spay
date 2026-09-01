const pool = require('../config/db');
const demoController = require('./demoController');

const getWallet = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, user_id, balance, created_at FROM wallets WHERE user_id = ?',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    return demoController.getWallet(req, res);
  }
};

const addMoney = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const numericAmount = Number(amount);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [walletRows] = await connection.execute('SELECT id, balance FROM wallets WHERE user_id = ?', [req.user.id]);

      if (!walletRows.length) {
        await connection.rollback();
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const newBalance = Number(walletRows[0].balance) + numericAmount;
      await connection.execute('UPDATE wallets SET balance = ? WHERE user_id = ?', [newBalance, req.user.id]);

      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await connection.execute(
        'INSERT INTO transactions (transaction_id, sender_id, receiver_id, amount, transaction_type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [transactionId, null, req.user.id, numericAmount, 'added', 'success', `Demo wallet top-up via ${paymentMethod || 'UPI'}`]
      );

      await connection.commit();

      res.status(200).json({
        message: 'Money added successfully',
        balance: newBalance,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return demoController.addMoney(req, res);
  }
};

const getWalletHistory = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, u1.name AS sender_name, u2.name AS receiver_name
       FROM transactions t
       LEFT JOIN users u1 ON t.sender_id = u1.id
       LEFT JOIN users u2 ON t.receiver_id = u2.id
       WHERE t.sender_id = ? OR t.receiver_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id, req.user.id]
    );

    res.json(rows);
  } catch (error) {
    return demoController.getWalletHistory(req, res);
  }
};

module.exports = { getWallet, addMoney, getWalletHistory };
