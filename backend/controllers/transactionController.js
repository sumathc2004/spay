const pool = require('../config/db');
const demoController = require('./demoController');

const createTransaction = async (req, res, next) => {
  try {
    const { recipient, amount, description } = req.body;

    if (!recipient || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Recipient and valid amount are required' });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const numericAmount = Number(amount);
      const targetEmail = recipient.trim().toLowerCase();

      const [recipientRows] = await connection.execute(
        'SELECT id, name, email, phone, spay_id FROM users WHERE email = ? OR phone = ? OR spay_id = ?',
        [targetEmail, recipient, recipient]
      );

      if (!recipientRows.length) {
        await connection.rollback();
        return res.status(404).json({ message: 'Recipient not found' });
      }

      const receiver = recipientRows[0];

      if (receiver.id === req.user.id) {
        await connection.rollback();
        return res.status(400).json({ message: 'You cannot send money to yourself' });
      }

      const [walletRows] = await connection.execute('SELECT balance FROM wallets WHERE user_id = ?', [req.user.id]);

      if (!walletRows.length) {
        await connection.rollback();
        return res.status(404).json({ message: 'Your wallet was not found' });
      }

      const senderBalance = Number(walletRows[0].balance);

      if (senderBalance < numericAmount) {
        await connection.rollback();
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      const senderNewBalance = senderBalance - numericAmount;
      const receiverWallet = await connection.execute('SELECT balance FROM wallets WHERE user_id = ?', [receiver.id]);
      const receiverBalance = Number(receiverWallet[0][0].balance || 0);
      const receiverNewBalance = receiverBalance + numericAmount;

      await connection.execute('UPDATE wallets SET balance = ? WHERE user_id = ?', [senderNewBalance, req.user.id]);
      await connection.execute('UPDATE wallets SET balance = ? WHERE user_id = ?', [receiverNewBalance, receiver.id]);

      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await connection.execute(
        'INSERT INTO transactions (transaction_id, sender_id, receiver_id, amount, transaction_type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [transactionId, req.user.id, receiver.id, numericAmount, 'sent', 'success', description || 'Money transfer']
      );

      await connection.execute(
        'INSERT INTO transactions (transaction_id, sender_id, receiver_id, amount, transaction_type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          `${transactionId}-R`,
          receiver.id,
          req.user.id,
          numericAmount,
          'received',
          'success',
          `Money received from ${req.user.name}`,
        ]
      );

      await connection.commit();

      res.status(201).json({ message: 'Transaction successful', balance: senderNewBalance });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return demoController.sendMoney(req, res);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, s.name AS sender_name, r.name AS receiver_name
       FROM transactions t
       LEFT JOIN users s ON t.sender_id = s.id
       LEFT JOIN users r ON t.receiver_id = r.id
       WHERE t.sender_id = ? OR t.receiver_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id, req.user.id]
    );

    res.json(rows);
  } catch (error) {
    return demoController.getTransactions(req, res);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, s.name AS sender_name, r.name AS receiver_name
       FROM transactions t
       LEFT JOIN users s ON t.sender_id = s.id
       LEFT JOIN users r ON t.receiver_id = r.id
       WHERE t.id = ? AND (t.sender_id = ? OR t.receiver_id = ?)`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    return demoController.getTransactionById(req, res);
  }
};

module.exports = { createTransaction, getTransactions, getTransactionById };
