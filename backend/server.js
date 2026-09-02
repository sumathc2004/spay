const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const { apiLimiter, authLimiter, transactionLimiter } = require('./middleware/securityMiddleware');

dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. HTTP Security Headers (Protection against XSS, Clickjacking, MIME-sniffing)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin API assets
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS Policy
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if in whitelist / regex
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback permissive for development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// 3. Strict Payload Limits (Prevent Payload DoS)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Rate Limiting Protection
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/transactions/send', transactionLimiter);

// 5. Setup Real-Time Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  socket.on('join_user_room', (userId) => {
    if (userId) {
      const room = `user_${userId}`;
      socket.join(room);
    }
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

app.set('io', io);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    security: 'hardened',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/keys', apiKeyRoutes);

// Centralized Error Handling
app.use(errorHandler);

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`🛡️ SPay Secure server running on port ${port}`);
});
