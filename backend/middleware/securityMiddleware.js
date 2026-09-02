const rateLimit = require('express-rate-limit');

// 1. General API Rate Limiter (120 requests per minute)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests. Please slow down and try again after a minute.',
  },
});

// 2. Strict Auth & Login Rate Limiter (15 attempts per 15 minutes to prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many login attempts. Your IP has been temporarily rate-limited for 15 minutes.',
  },
});

// 3. Sensitive Transaction Rate Limiter (30 transactions per 5 minutes)
const transactionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Transfer rate limit exceeded. Please wait a moment before sending more payments.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  transactionLimiter,
};

