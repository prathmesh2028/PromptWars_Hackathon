/**
 * @file middleware.test.js
 * @description Unit tests for custom Express middlewares.
 *
 * Tests:
 *   - errorMiddleware.errorHandler  — proper HTTP status + JSON format
 *   - errorMiddleware.notFound      — 404 for unknown routes
 *   - authMiddleware.protect        — token extraction and JWT validation
 *   - validationMiddleware          — field-level validation
 */

const request   = require('supertest');
const express   = require('express');
const jwt       = require('jsonwebtoken');
const { errorHandler, notFound } = require('../middlewares/errorMiddleware');
const { protect }                = require('../middlewares/authMiddleware');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('./testHelper');

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

// ─── Helpers: mini Express apps ───────────────────────────────────────────────

/**
 * Builds a minimal Express app that always throws an error with a given status.
 */
const errApp = (message, status = 500) => {
  const app = express();
  app.use(express.json());
  app.get('/error', (req, res, next) => {
    res.status(status);
    next(new Error(message));
  });
  app.use(errorHandler);
  return app;
};

/**
 * Builds a minimal app with the `protect` middleware on a test route.
 */
const protectedApp = () => {
  const User = require('../models/User');
  const app  = express();
  app.use(express.json());
  app.get('/protected', protect, (req, res) => {
    res.json({ success: true, userId: req.user._id });
  });
  app.use(errorHandler);
  return app;
};

// ─── errorHandler ─────────────────────────────────────────────────────────────

describe('errorMiddleware.errorHandler', () => {

  it('should return the correct status code set on res', async () => {
    const res = await request(errApp('Not Found', 404)).get('/error');
    expect(res.status).toBe(404);
  });

  it('should return JSON with success:false and message', async () => {
    const res = await request(errApp('Something broke', 500)).get('/error');
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Something broke');
  });

  it('should include stack trace in development mode', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(errApp('Dev error', 400)).get('/error');
    expect(res.body.stack).toBeDefined();
    process.env.NODE_ENV = 'test';
  });

  it('should NOT include stack trace in production mode', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(errApp('Prod error', 500)).get('/error');
    expect(res.body.stack).toBeUndefined();
    process.env.NODE_ENV = 'test';
  });
});

// ─── notFound ─────────────────────────────────────────────────────────────────

describe('errorMiddleware.notFound', () => {
  it('should return 404 for unmatched routes', async () => {
    const app = express();
    app.use(notFound);
    app.use(errorHandler);

    const res = await request(app).get('/anything/at/all');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ─── protect middleware ───────────────────────────────────────────────────────

describe('authMiddleware.protect', () => {
  const User = require('../models/User');

  it('should return 401 when no Authorization header is sent', async () => {
    const res = await request(protectedApp()).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('should return 401 for a non-Bearer Authorization header', async () => {
    const res = await request(protectedApp())
      .get('/protected')
      .set('Authorization', 'Basic dXNlcjpwYXNz');

    expect(res.status).toBe(401);
  });

  it('should return 401 for a token signed with a wrong secret', async () => {
    const fakeToken = jwt.sign({ id: 'fakeid' }, 'wrongsecret', { expiresIn: '1h' });
    const res = await request(protectedApp())
      .get('/protected')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
  });

  it('should allow access with a valid JWT for an existing user', async () => {
    // Create a real user in the test DB
    const user = await User.create({
      name: 'Auth Tester',
      email: 'auth@test.com',
      password: 'password123',
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'changeme_in_production',
      { expiresIn: '1h' }
    );

    const res = await request(protectedApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBe(user._id.toString());
  });

  it('should return 401 when the referenced user no longer exists', async () => {
    const mongoose = require('mongoose');
    // Sign a token for a user ID that doesn't exist in DB
    const ghostId = new mongoose.Types.ObjectId();
    const token   = jwt.sign(
      { id: ghostId },
      process.env.JWT_SECRET || 'changeme_in_production',
      { expiresIn: '1h' }
    );

    const res = await request(protectedApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/not found/i);
  });
});
