/**
 * @file app.js
 * @description Express application factory — separated from server.js so that
 * tests can import the app without actually starting a TCP listener.
 *
 * Usage:
 *   Production:  require('./server.js')  → starts HTTP server
 *   Tests:       require('./app.js')     → returns Express app (no listen)
 */

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes              = require('./routes/auth');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const createApp = () => {
  const app = express();

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS
  app.use(cors({
    origin:      process.env.FRONTEND_URL || '*',
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Disable rate limiting in tests to avoid 429 failures on rapid requests
  if (process.env.NODE_ENV !== 'test') {
    app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
    app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
  }

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // Routes
  app.get('/', (req, res) => res.status(200).json({
    success:     true,
    service:     'SmartVenue AI Backend',
    version:     '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  }));
  app.use('/api/auth', authRoutes);

  // Error handlers
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
