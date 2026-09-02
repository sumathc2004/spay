const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Real-Time Socket Connection Room Mapping
io.on('connection', (socket) => {
  // Join a private room based on user ID
  socket.on('join_user_room', (userId) => {
    if (userId) {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`⚡ User ${userId} joined real-time socket room: ${room}`);
    }
  });

  socket.on('disconnect', () => {
    // disconnected cleanly
  });
});

// Attach io to Express app
app.set('io', io);

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SPay real-time backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/keys', apiKeyRoutes);

// Error Handler Middleware
app.use(errorHandler);

server.listen(port, () => {
  console.log(`SPay server running with Real-Time WebSockets on port ${port}`);
});
