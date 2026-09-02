const { mockUsers, mockWallets, mockTransactions } = require('../demo-data');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const payoutGateway = require('../utils/payoutGateway');

const JWT_SECRET = process.env.JWT_SECRET || 'spay_demo_secret_2026';

// In-memory preferences and login sessions
const userPreferences = {
  1: {
    emailTxnAlerts: true,
    emailSecurityAlerts: true,
    emailMarketing: false,
    emailWeeklyDigest: true,
    pushNotifications: true,
    smsHighValueAlerts: true,
    newDeviceAlerts: true
  }
};

const loginSessions = {
  1: [
    {
      id: 1,
      device: 'Chrome on Windows 11',
      ip: '192.168.29.67',
      location: 'Bangalore, India',
      lastActive: 'Active Now',
      isCurrent: true
    },
    {
      id: 2,
      device: 'Safari on iPhone 15 Pro',
      ip: '192.168.29.102',
      location: 'Bangalore, India',
      lastActive: '2 hours ago',
      isCurrent: false
    }
  ]
};

const demoController = {
  // Auth
  registerUser: async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase();
    if (mockUsers[normalizedEmail]) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const userId = Math.max(...Object.values(mockUsers).map((u) => u.id || 0), 0) + 1;
    const spayId = 'SPAY' + Math.random().toString(36).substring(2, 9).toUpperCase();

    mockUsers[normalizedEmail] = {
      id: userId,
      name,
      email: normalizedEmail,
      phone,
      password,
      spay_id: spayId,
      role: 'user',
      created_at: new Date().toISOString()
    };

    mockWallets[userId] = {
      id: userId,
      user_id: userId,
      balance: 1000
    };

    res.status(201).json({
      message: 'User registered successfully. Please log in.',
      user: { id: userId, name, email: normalizedEmail, phone, spay_id: spayId }
    });
  },

  loginUser: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = mockUsers[normalizedEmail];

    if (!user || (user.password !== password && !bcrypt.compareSync(password, user.password || ''))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        spay_id: user.spay_id,
        role: user.role || 'user'
      }
    });
  },

  logoutAll: async (req, res) => {
    loginSessions[req.user.id] = [
      {
        id: Date.now(),
        device: 'Current Device',
        ip: '127.0.0.1',
        location: 'Localhost',
        lastActive: 'Just now',
        isCurrent: true
      }
    ];
    res.json({ message: 'Logged out of all other devices successfully' });
  },

  getProfile: async (req, res) => {
    const user = Object.values(mockUsers).find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      spay_id: user.spay_id,
      role: user.role || 'user',
      created_at: user.created_at
    });
  },

  updateProfile: async (req, res) => {
    const { name, phone } = req.body;
    const user = Object.values(mockUsers).find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    res.json({ message: 'Profile updated successfully' });
  },

  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = Object.values(mockUsers).find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== currentPassword && !bcrypt.compareSync(currentPassword, user.password || '')) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    res.json({ message: 'Password changed successfully' });
  },

  getPreferences: async (req, res) => {
    if (!userPreferences[req.user.id]) {
      userPreferences[req.user.id] = {
        emailTxnAlerts: true,
        emailSecurityAlerts: true,
        emailMarketing: false,
        emailWeeklyDigest: true,
        pushNotifications: true,
        smsHighValueAlerts: true,
        newDeviceAlerts: true
      };
    }
    res.json(userPreferences[req.user.id]);
  },

  updatePreferences: async (req, res) => {
    userPreferences[req.user.id] = {
      ...userPreferences[req.user.id],
      ...req.body
    };
    res.json({ message: 'Preferences updated successfully', preferences: userPreferences[req.user.id] });
  },

  getLoginActivity: async (req, res) => {
    const sessions = loginSessions[req.user.id] || [
      {
        id: 1,
        device: 'Current Browser Session',
        ip: '127.0.0.1',
        location: 'Localhost / Detected IP',
        lastActive: 'Active Now',
        isCurrent: true
      }
    ];
    res.json(sessions);
  },

  // Wallet
  getWallet: async (req, res) => {
    if (!mockWallets[req.user.id]) {
      mockWallets[req.user.id] = { id: req.user.id, user_id: req.user.id, balance: 5000 };
    }
    res.json(mockWallets[req.user.id]);
  },

  addMoney: async (req, res) => {
    const { amount, paymentMethod } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if (!mockWallets[req.user.id]) {
      mockWallets[req.user.id] = { id: req.user.id, user_id: req.user.id, balance: 0 };
    }

    mockWallets[req.user.id].balance += numAmount;

    const utr = payoutGateway.generateUTR();
    const newTx = {
      id: mockTransactions.length + 1,
      transaction_id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      utr_number: utr,
      sender_id: null,
      receiver_id: req.user.id,
      sender_name: `${paymentMethod || 'UPI'} Top-up`,
      receiver_name: req.user.name,
      amount: numAmount,
      transaction_type: 'added',
      status: 'success',
      description: `Wallet top-up via ${paymentMethod || 'UPI'} (UTR: ${utr})`,
      created_at: new Date().toISOString()
    };

    mockTransactions.unshift(newTx);

    // Emit live WebSocket update
    const io = req.app?.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('wallet_updated', {
        balance: mockWallets[req.user.id].balance,
        transaction: newTx
      });
    }

    res.json({
      message: 'Money added successfully',
      balance: mockWallets[req.user.id].balance,
      wallet: mockWallets[req.user.id],
      transaction: newTx
    });
  },

  getWalletHistory: async (req, res) => {
    const txs = mockTransactions.filter(
      (t) => t.sender_id === req.user.id || t.receiver_id === req.user.id
    );
    res.json(txs);
  },

  // Lookup Phone Number / UPI ID / Email
  lookupRecipient: async (req, res) => {
    const query = (req.query.query || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Check if searching self
    if (
      query === (req.user.email || '').toLowerCase() ||
      query === req.user.phone ||
      query === (req.user.spay_id || '').toLowerCase() ||
      query === `${req.user.phone}@spay`
    ) {
      return res.status(400).json({ message: 'You cannot send money to yourself' });
    }

    // Search in mock users
    const matched = Object.values(mockUsers).find((u) => {
      const emailMatch = u.email.toLowerCase() === query;
      const phoneMatch = u.phone === query;
      const spayIdMatch = u.spay_id && u.spay_id.toLowerCase() === query;
      const upiMatch = `${u.phone}@spay` === query || (u.spay_id && `${u.spay_id.toLowerCase()}@spay` === query);
      return emailMatch || phoneMatch || spayIdMatch || upiMatch;
    });

    if (matched) {
      return res.json({
        exists: true,
        id: matched.id,
        name: matched.name,
        phone: matched.phone,
        email: matched.email,
        spay_id: matched.spay_id,
        upi_id: `${matched.phone}@spay`,
        avatar: matched.name ? matched.name.charAt(0).toUpperCase() : 'U',
        verified: true
      });
    }

    // If it's any valid UPI handle format (e.g. rahul@okaxis, merchant@paytm), allow transfer
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

    return res.status(404).json({ exists: false, message: 'Recipient not found. Check phone number or UPI ID.' });
  },

  // Transactions: Send Money with UPI PIN & WebSockets
  sendMoney: async (req, res) => {
    const { recipient, amount, description, upiPin } = req.body;
    const numAmount = Number(amount);

    if (!recipient || !numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Recipient and valid amount are required' });
    }

    // Verify 4-digit UPI PIN (Demo accepts '1234' or any valid 4-digit numeric PIN)
    if (!upiPin || String(upiPin).length < 4) {
      return res.status(400).json({ message: 'Please enter a valid 4-digit UPI Security PIN' });
    }

    const senderWallet = mockWallets[req.user.id] || { balance: 0 };
    if (senderWallet.balance < numAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const cleanRecip = recipient.trim().toLowerCase();
    const targetUser = Object.values(mockUsers).find(
      (u) =>
        u.email.toLowerCase() === cleanRecip ||
        u.phone === recipient.trim() ||
        (u.spay_id && u.spay_id.toLowerCase() === cleanRecip) ||
        `${u.phone}@spay` === cleanRecip
    );

    const receiverName = targetUser ? targetUser.name : (recipient.includes('@') ? recipient.split('@')[0].toUpperCase() : recipient.trim());
    const receiverId = targetUser ? targetUser.id : 999;

    if (targetUser && targetUser.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot send money to yourself' });
    }

    // Deduct from sender
    senderWallet.balance -= numAmount;

    // Credit receiver if exists
    if (mockWallets[receiverId]) {
      mockWallets[receiverId].balance += numAmount;
    }

    const utr = payoutGateway.generateUTR();
    const txId = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const senderTx = {
      id: mockTransactions.length + 1,
      transaction_id: txId,
      utr_number: utr,
      sender_id: req.user.id,
      receiver_id: receiverId,
      sender_name: req.user.name,
      receiver_name: receiverName,
      amount: numAmount,
      transaction_type: 'sent',
      status: 'success',
      description: description || `Transfer to ${receiverName}`,
      created_at: new Date().toISOString()
    };

    mockTransactions.unshift(senderTx);

    // If receiver is in mockTransactions, create their receipt
    if (targetUser) {
      const receiverTx = {
        id: mockTransactions.length + 1,
        transaction_id: `${txId}-R`,
        utr_number: utr,
        sender_id: req.user.id,
        receiver_id: receiverId,
        sender_name: req.user.name,
        receiver_name: receiverName,
        amount: numAmount,
        transaction_type: 'received',
        status: 'success',
        description: `Received from ${req.user.name}`,
        created_at: new Date().toISOString()
      };
      mockTransactions.unshift(receiverTx);

      // Real-time socket notification to receiver
      const io = req.app?.get('io');
      if (io) {
        io.to(`user_${receiverId}`).emit('payment_received', {
          amount: numAmount,
          sender_name: req.user.name,
          transaction_id: txId,
          utr_number: utr,
          created_at: receiverTx.created_at,
          balance: mockWallets[receiverId]?.balance || 0
        });
      }
    }

    // Real-time socket update to sender
    const io = req.app?.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('payment_sent', {
        balance: senderWallet.balance,
        transaction: senderTx
      });
    }

    res.status(201).json({
      message: 'Transaction successful',
      balance: senderWallet.balance,
      transaction: senderTx,
      utr_number: utr
    });
  },

  getTransactions: async (req, res) => {
    const txs = mockTransactions.filter(
      (t) => t.sender_id === req.user.id || t.receiver_id === req.user.id
    );
    res.json(txs);
  },

  getTransactionById: async (req, res) => {
    const tx = mockTransactions.find((t) => String(t.id) === String(req.params.id));
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  },

  // Admin
  getAllUsers: async (req, res) => {
    const users = Object.values(mockUsers).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      spay_id: u.spay_id,
      role: u.role || 'user',
      created_at: u.created_at || new Date().toISOString()
    }));
    res.json(users);
  },

  getAllTransactions: async (req, res) => {
    res.json(mockTransactions);
  },

  getStatistics: async (req, res) => {
    const totalUsers = Object.keys(mockUsers).length;
    const activeUsers = Object.values(mockUsers).filter((u) => u.role === 'user').length;
    const totalTransactions = mockTransactions.length;
    const totalTransactionVolume = mockTransactions
      .filter((t) => t.status === 'success')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    res.json({
      totalUsers,
      activeUsers,
      totalTransactions,
      totalTransactionVolume
    });
  }
};

module.exports = demoController;
