/**
 * @file app.js
 * @description Express application factory — refactored for Next.js Standalone proxying.
 */

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes                 = require('./routes/auth');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const createApp = () => {
  const app = express();

  // Trust Cloud Run's proxy
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({ 
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));

  // CORS
  app.use(cors({
    origin:         process.env.FRONTEND_URL || '*',
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting
  if (process.env.NODE_ENV !== 'test') {
    app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
  }

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // ── API Routes ────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);

  // ── Frontend Proxy ────────────────────────────────────────────────
  // In production (single container), proxy all non-API requests to the
  // Next.js standalone server running on port 3000.
  if (process.env.NODE_ENV !== 'test') {
    const { createProxyMiddleware } = require('http-proxy-middleware');
    const NEXT_PORT = process.env.NEXT_PORT || 3000;

    app.use(
      createProxyMiddleware({
        target:       `http://127.0.0.1:${NEXT_PORT}`,
        changeOrigin: false,
        ws: false,
        on: {
          error: (_err, _req, res) => {
            if (res && !res.headersSent) {
              res.status(503).send(
                '<!doctype html><html><body>' +
                '<h2>Frontend is starting up — please refresh in a moment.</h2>' +
                '</body></html>'
              );
            }
          },
        },
      })
    );
  } else {
    app.use(notFound);
  }

  // ── Error handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
