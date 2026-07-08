require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { createRedisClient } = require('./config/redis');

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: false
}));
app.use(cors({
  origin: '*', // In production, replace with frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Submission Rate Limiter
const submitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 submissions per minute for developer testing
  message: { message: 'Too many submissions. Please wait before submitting code again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/ai', require('./routes/ai'));
// Apply rate limiter to submission endpoint
app.use('/api/submissions', (req, res, next) => {
  if (req.method === 'POST') {
    return submitLimiter(req, res, next);
  }
  next();
}, require('./routes/submissions'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/users', require('./routes/users'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  // Serve static assets from frontend/dist
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  // Point fallback routes to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend', 'dist', 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Configure Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Client joins their personal room
  socket.on('join', (userId) => {
    socket.join(userId.toString());
    console.log(`Socket client ${socket.id} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Setup Redis Pub/Sub for Real-time Verdict Updates
const subClient = createRedisClient();
subClient.subscribe('submission_updates', (err, count) => {
  if (err) {
    console.error('Failed to subscribe to Redis submission_updates channel:', err);
  } else {
    console.log(`Subscribed to Redis submission_updates channel. Listening on ${count} channel(s).`);
  }
});

subClient.on('message', (channel, message) => {
  if (channel === 'submission_updates') {
    try {
      const payload = JSON.parse(message);
      const { userId, submissionId, verdict, testCasesPassedCount, executionTime, memoryUsed } = payload;
      
      console.log(`Relaying verdict event for submission ${submissionId} to user room ${userId}`);
      io.to(userId.toString()).emit('submission_verdict', payload);
    } catch (err) {
      console.error('Failed to parse Pub/Sub message:', err);
    }
  }
});

// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Express server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
