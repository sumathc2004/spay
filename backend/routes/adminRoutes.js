const express = require('express');
const { getAllUsers, getAllTransactions, getStatistics } = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users', protect, getAllUsers);
router.get('/transactions', protect, getAllTransactions);
router.get('/statistics', protect, getStatistics);

module.exports = router;
