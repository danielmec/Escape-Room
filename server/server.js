// server/server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure CORS for socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Test endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Listen for chat messages (previously "testEvent")
  socket.on('testEvent', (data) => {
    console.log('Received chat message:', data);
    // Broadcast the received message and nickname to all connected clients
    io.emit('testResponse', {
      nickname: data.nickname,
      message: data.message
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
