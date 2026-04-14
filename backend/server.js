/**
 * @file server.js
 * @description HTTP server entry point. Imports the Express app from app.js,
 * attaches Socket.IO, connects the database, and starts listening.
 */

require('dotenv').config();

const http           = require('http');
const createApp      = require('./app');
const connectDB      = require('./database');
const { initSocket } = require('./socket');

const app    = createApp();
const server = http.createServer(app);

// Connect database (boots MongoMemoryServer + seeds)
connectDB();

// Initialize Socket.IO real-time simulation
initSocket(server);

const PORT = parseInt(process.env.PORT || '5000', 10);

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       SmartVenue AI — Backend v2.0       ║
╠══════════════════════════════════════════╣
║  PORT:   ${PORT}                             ║
║  MODE:   ${(process.env.NODE_ENV || 'development').padEnd(12)}                ║
║  STATUS: Online ✓                        ║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown on unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  server.close(() => process.exit(1));
});
