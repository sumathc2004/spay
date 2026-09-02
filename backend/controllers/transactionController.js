const pool = require('../config/db');
const demoController = require('./demoController');
const payoutGateway = require('../utils/payoutGateway');

const lookupRecipient = async (req, res, next) => {
  try {
    const query = (req.query.query || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    if (
      query === (req.user.email || '').toLowerCase() ||
      query === req.user.phone ||
      query === (req.user.spay_id || '').toLowerCase() ||
      query === `${req.user.phone}@spay`
    ) {
      return res.status(400).json({ message: 'You cannot send money to yourself' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, spay_id FROM users WHERE email = ? OR phone = ? OR spay_id = ?',
      [query, query, query]
    );

    if (rows.length) {
      const u = rows[0];
      return res.json({
        exists: true,
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        spay_id: u.spay_id,
        upi_id: `${u.phone}@spay`,
        avatar: u.name ? u.name.charAt(0).toUpperCase() : 'U',
        verified: true
      });
    }

    // External UPI validation
    const upiCheck = await payoutGateway.validateUPI(query);
    if (upiCheck.isValid) {
      const parts = query.split('@');
      const guessedName = parts[0].replace(/[._]/g, ' ').toUpperCase();
      return res.json({
        exists: true,
        name: guessedName,
        upi_id: query,
        phone: upiCheck.type === 'phone' ? query : '',
        avatar: guessedName.charAt(0) || 'U',
        verified: true,
        isExternalUPI: true
      });
    }

    return res.status(404).json({ exists: false, message: 'Recipient not found' });
  } catch (error) {
    return demoController.lookupRecipient(req, res);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const { recipient, amount, description, upiPin } = req.body;

    if (!recipient || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Recipient and valid amount are required' });
    }

    if (!upiPin || String(upiPin).length < 4) {
      return res.status(400).json({ message: 'Please enter a valid 4-digit UPI Security PIN' });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const numericAmount = Number(amount);
      const cleanRecip = recipient.trim().toLowerCase();

      const [recipientRows] = await connection.execute(
        'SELECT id, name, email, phone, spay_id FROM users WHERE email = ? OR phone = ? OR spay_id = ?',
        [cleanRecip, recipient.trim(), recipient.trim()]
      );

      let receiver = recipientRows[0];
      let receiverId = receiver ? receiver.id : 999;
      let receiverName = receiver ? receiver.name : (recipient.includes('@') ? recipient.split('@')[0].toUpperCase() : recipient.trim());

      if (receiver && receiver.id === req.user.id) {
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
      await connection.execute('UPDATE wallets SET balance = ? WHERE user_id = ?', [senderNewBalance, req.user.id]);

      if (receiver) {
        const [receiverWallet] = await connection.execute('SELECT balance FROM wallets WHERE user_id = ?', [receiver.id]);
        const receiverBalance = Number(receiverWallet[0]?.balance || 0);
        const receiverNewBalance = receiverBalance + numericAmount;
        await connection.execute('UPDATE wallets SET balance = ? WHERE user_id = ?', [receiverNewBalance, receiver.id]);
      }

      const utr = payoutGateway.generateUTR();
      const transactionId = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      await connection.execute(
        'INSERT INTO transactions (transaction_id, sender_id, receiver_id, amount, transaction_type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [transactionId, req.user.id, receiverId, numericAmount, 'sent', 'success', description || `Transfer to ${receiverName} (UTR: ${utr})`]
      );

      if (receiver) {
        await connection.execute(
          'INSERT INTO transactions (transaction_id, sender_id, receiver_id, amount, transaction_type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            `${transactionId}-R`,
            receiver.id,
            req.user.id,
            numericAmount,
            'received',
            'success',
            `Received from ${req.user.name} (UTR: ${utr})`,
          ]
        );
      }

      await connection.commit();

      const io = req.app?.get('io');
      if (io && receiver) {
        io.to(`user_${receiver.id}`).emit('payment_received', {
          amount: numericAmount,
          sender_name: req.user.name,
          transaction_id: transactionId,
          utr_number: utr,
          created_at: new Date().toISOString()
        });
      }

      if (io) {
        io.to(`user_${req.user.id}`).emit('payment_sent', {
          balance: senderNewBalance,
          amount: numericAmount,
          receiver_name: receiverName,
          utr_number: utr
        });
      }

      res.status(201).json({
        message: 'Transaction successful',
        balance: senderNewBalance,
        transaction: {
          transaction_id: transactionId,
          utr_number: utr,
          amount: numericAmount,
          receiver_name: receiverName,
          created_at: new Date().toISOString()
        },
        utr_number: utr
      });
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

module.exports = { lookupRecipient, createTransaction, getTransactions, getTransactionById };
