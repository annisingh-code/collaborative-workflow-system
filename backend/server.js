const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development. In production, set to your frontend URL
    methods: ['GET', 'POST', 'PUT']
  }
});

// Make 'io' accessible inside our Express routes!
app.set('io', io);

// WebSocket Connection Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Clients will join a "room" named after the projectId they are viewing
  socket.on('joinProject', (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined project room: ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects/:projectId/tasks', require('./routes/tasks'));
app.use('/api/projects/:projectId', require('./routes/execution'));

const PORT = process.env.PORT || 5000;
// CRITICAL: Change app.listen to server.listen for WebSockets to work
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));