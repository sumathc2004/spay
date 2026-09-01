const express = require('express');
const { registerUser, loginUser, getProfile, logoutUser } = require('../controllers/authController');
const demoController = require('../controllers/demoController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.post('/logout', protect, logoutUser);
router.post('/logout-all', protect, (req, res) => demoController.logoutAll(req, res));

module.exports = router;
