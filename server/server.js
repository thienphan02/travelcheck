const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');


// Import routes
const authRoutes = require('./authRoutes');
const reviewRoutes = require('./reviewRoutes');
const blogRoutes = require('./blogRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const mapRoutes = require('./mapRoutes');
const settingsRoutes = require('./settingsRoutes');
const manageRoutes = require('./manageRoutes');
const adminUserRoutes = require('./adminUserRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// CORS configuration

const corsOptions = {
  origin:'*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Register routes
app.use(authRoutes);
app.use(reviewRoutes);
app.use(blogRoutes);
app.use(favoriteRoutes);
app.use(mapRoutes);
app.use(settingsRoutes);
app.use(manageRoutes);
app.use(adminUserRoutes);

// Ensures all unknown routes return the index.html for client-side routing.
app.use(express.static(path.join(__dirname, '../build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

//Handles WebSocket connections.
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  
  ws.on('message', (message) => {
    console.log('Received:', message);
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

/*
 * Handles HTTP to WebSocket protocol upgrade.
 * request - Incoming HTTP request.
 * socket - Network socket between client and server.
 * head - First packet of the upgraded WebSocket stream.
 */
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// start the server
const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
