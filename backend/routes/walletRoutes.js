const express = require('express');
const { getWallet, addMoney, getWalletHistory } = require('../controllers/walletController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getWallet);
router.post('/add-money', protect, addMoney);
router.get('/history', protect, getWalletHistory);

module.exports = router;
