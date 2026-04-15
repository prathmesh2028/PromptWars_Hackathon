/**
 * @file server.js
 * @description Production server entry point with Cloud Run compatibility.
 */

require('dotenv').config();

const http           = require('http');
const createApp      = require('./app');
const connectDB      = require('./database');
const { initSocket } = require('./socket');

/**
 * Startup sequence for production reliability.
 * Server starts strictly on 0.0.0.0:${PORT} to satisfy Cloud Run.
 */
const startServer = async () => {
  try {
    const app = createApp();
    const server = http.createServer(app);

    // 1. Initialize Real-time features
    initSocket(server);

    // 2. Trigger Database Connection (Asynchronous)
    // We launch it WITHOUT blocking the HTTP listener. 
    // This ensures Cloud Run health checks pass even if DB is slow.
    connectDB().catch(err => {
      console.error('✗ Async database error on startup:', err);
    });

    // 3. Bind to Cloud Run PORT (Mandatory 8080 or process.env.PORT)
    const PORT = process.env.PORT || 8080;
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔══════════════════════════════════════════════════╗
║        SmartVenue AI — Hardened Backend          ║
╠══════════════════════════════════════════════════╣
║  PORT:    ${PORT.toString().padEnd(38)} ║
║  HOST:    0.0.0.0                                ║
║  STATUS:  Online & Accepting Traffic ✓           ║
╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('✗ FATAL ERROR: Application failed to start.');
    console.error(err);
    process.exit(1);
  }
};

// Start the engine
startServer();

// Global handles for process stability
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});
