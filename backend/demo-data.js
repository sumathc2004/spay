// In-Memory Database Store for robust demo functionality
const mockUsers = {
  'sumathc2004@gmail.com': {
    id: 1,
    email: 'sumathc2004@gmail.com',
    password: 'Suman@123',
    name: 'Suman',
    phone: '9876543210',
    spay_id: 'SPAY123456789',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  'demo@spay.com': {
    id: 2,
    email: 'demo@spay.com',
    password: 'Demo@123',
    name: 'Rahul Sharma',
    phone: '9876543211',
    spay_id: 'SPAY987654321',
    role: 'user',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  'priya@spay.com': {
    id: 3,
    email: 'priya@spay.com',
    password: 'Priya@123',
    name: 'Priya Patel',
    phone: '9876543212',
    spay_id: 'SPAY555888999',
    role: 'user',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
};

const mockWallets = {
  1: { id: 1, user_id: 1, balance: 25000 },
  2: { id: 2, user_id: 2, balance: 8500 },
  3: { id: 3, user_id: 3, balance: 14200 }
};

const mockTransactions = [
  {
    id: 1,
    transaction_id: 'TXN-1725000001-101',
    sender_id: 1,
    receiver_id: 2,
    sender_name: 'Suman',
    receiver_name: 'Rahul Sharma',
    amount: 500,
    transaction_type: 'sent',
    status: 'success',
    description: 'Dinner payment',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 2,
    transaction_id: 'TXN-1725000002-102',
    sender_id: 3,
    receiver_id: 1,
    sender_name: 'Priya Patel',
    receiver_name: 'Suman',
    amount: 1500,
    transaction_type: 'received',
    status: 'success',
    description: 'Project reimbursement',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: 3,
    transaction_id: 'TXN-1725000003-103',
    sender_id: null,
    receiver_id: 1,
    sender_name: 'UPI / Bank',
    receiver_name: 'Suman',
    amount: 5000,
    transaction_type: 'added',
    status: 'success',
    description: 'Wallet top-up via UPI',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString()
  }
];

module.exports = {
  mockUsers,
  mockWallets,
  mockTransactions
};
