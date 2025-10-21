const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const AssistantEngine = require('./services/assistantEngine');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Initialize Assistant Engine
const assistant = new AssistantEngine();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Smart Assistant Server is running!', version: '2.0.0' });
});

app.post('/api/command', async (req, res) => {
  try {
    const { command, userId } = req.body;
    logger.info(`Processing command: ${command} from user: ${userId}`);
    
    const response = await assistant.processCommand(command, userId);
    res.json(response);
  } catch (error) {
    logger.error('Error processing command:', error);
    res.status(500).json({ error: 'Failed to process command' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.emit('welcome', {
    message: 'Connected to Smart Assistant Server',
    capabilities: [
      'Voice Commands',
      'Weather Information',
      'Mathematical Calculations',
      'Web Search',
      'System Information',
      'Time & Date',
      'Jokes & Entertainment'
    ]
  });

  socket.on('voice_command', async (data) => {
    try {
      const { command, userId } = data;
      logger.info(`Voice command received: ${command}`);
      
      const response = await assistant.processCommand(command, userId || socket.id);
      
      socket.emit('assistant_response', {
        ...response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error processing voice command:', error);
      socket.emit('error', { message: 'Failed to process command' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Serve React app for production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

server.listen(PORT, () => {
  logger.info(`Smart Assistant Server running on port ${PORT}`);
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});

module.exports = { app, server, io };
