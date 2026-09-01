const { mockUsers, mockWallets, mockTransactions } = require('../demo-data');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    const newTx = {
      id: mockTransactions.length + 1,
      transaction_id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender_id: null,
      receiver_id: req.user.id,
      sender_name: `${paymentMethod || 'UPI'} Top-up`,
      receiver_name: req.user.name,
      amount: numAmount,
      transaction_type: 'added',
      status: 'success',
      description: `Wallet top-up via ${paymentMethod || 'UPI'}`,
      created_at: new Date().toISOString()
    };

    mockTransactions.unshift(newTx);

    res.json({
      message: 'Money added successfully',
      balance: mockWallets[req.user.id].balance,
      wallet: mockWallets[req.user.id]
    });
  },

  getWalletHistory: async (req, res) => {
    const txs = mockTransactions.filter(
      (t) => t.sender_id === req.user.id || t.receiver_id === req.user.id
    );
    res.json(txs);
  },

  // Transactions
  sendMoney: async (req, res) => {
    const { recipient, amount, description } = req.body;
    const numAmount = Number(amount);

    if (!recipient || !numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Recipient and valid amount are required' });
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
        (u.spay_id && u.spay_id.toLowerCase() === cleanRecip)
    );

    const receiverName = targetUser ? targetUser.name : recipient.trim();
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

    const txId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const senderTx = {
      id: mockTransactions.length + 1,
      transaction_id: txId,
      sender_id: req.user.id,
      receiver_id: receiverId,
      sender_name: req.user.name,
      receiver_name: receiverName,
      amount: numAmount,
      transaction_type: 'sent',
      status: 'success',
      description: description || 'Money transfer',
      created_at: new Date().toISOString()
    };

    mockTransactions.unshift(senderTx);

    res.status(201).json({
      message: 'Transaction successful',
      balance: senderWallet.balance,
      transaction: senderTx
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
