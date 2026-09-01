const express = require('express');
const crypto = require('crypto');
const protect = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { mockUsers } = require('../demo-data');

const router = express.Router();

// In-memory key store
const keyStore = {
  1: {
    publicKey: 'spay_pk_live_98a72f10d48b',
    secretKey: 'spay_sk_live_e5c2194b3018f972a1d044',
    webhookUrl: 'https://example.com/spay-webhook',
    createdAt: new Date().toISOString()
  }
};

const generateKeys = (userId) => {
  const pk = 'spay_pk_live_' + crypto.randomBytes(6).toString('hex');
  const sk = 'spay_sk_live_' + crypto.randomBytes(11).toString('hex');
  keyStore[userId] = {
    publicKey: pk,
    secretKey: sk,
    webhookUrl: keyStore[userId]?.webhookUrl || '',
    createdAt: new Date().toISOString()
  };
  return keyStore[userId];
};

// GET user's API Keys
router.get('/', protect, async (req, res) => {
  if (!keyStore[req.user.id]) {
    generateKeys(req.user.id);
  }
  res.json(keyStore[req.user.id]);
});

// Regenerate API Keys
router.post('/regenerate', protect, async (req, res) => {
  const keys = generateKeys(req.user.id);
  res.json({ message: 'API keys regenerated successfully', keys });
});

// Update Webhook URL
router.put('/webhook', protect, async (req, res) => {
  const { webhookUrl } = req.body;
  if (!keyStore[req.user.id]) {
    generateKeys(req.user.id);
  }
  keyStore[req.user.id].webhookUrl = webhookUrl || '';
  res.json({ message: 'Webhook URL updated successfully', webhookUrl: keyStore[req.user.id].webhookUrl });
});

// Merchant charge endpoint (Authenticated via x-api-key)
router.post('/charge', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const { amount, customer_email, order_id } = req.body;

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  // Find merchant owner of the secret key
  const merchantId = Object.keys(keyStore).find(uid => keyStore[uid].secretKey === apiKey);
  if (!merchantId) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const txnId = `TXN-API-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  res.status(200).json({
    status: 'success',
    transaction_id: txnId,
    order_id: order_id || `ORD-${Date.now()}`,
    amount: Number(amount),
    currency: 'INR',
    customer: customer_email || 'customer@spay.com',
    payment_link: `http://localhost:5173/pay/${txnId}`,
    created_at: new Date().toISOString()
  });
});

module.exports = router;

