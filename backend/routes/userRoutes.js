const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  getLoginActivity
} = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);
router.get('/login-activity', protect, getLoginActivity);

module.exports = router;
