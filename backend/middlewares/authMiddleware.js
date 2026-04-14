/**
 * @file authMiddleware.js
 * @description JWT authentication and role-based authorization middleware.
 *
 * Usage:
 *   router.get('/protected', protect, handler)
 *   router.get('/admin-only', protect, adminOnly, handler)
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * `protect` middleware — validates the Bearer JWT token.
 *
 * Extracts the token from the Authorization header, verifies it,
 * and attaches the matching user document to `req.user`.
 * Rejects the request with 401 if the token is missing, malformed,
 * expired, or references a non-existent user.
 *
 * @type {import('express').RequestHandler}
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    return next(new Error('Not authorized — no token provided.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme_in_production');

    // Re-fetch user to ensure they still exist and haven't been deactivated
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      return next(new Error('Not authorized — user account not found.'));
    }

    req.user = user; // Attach to request for downstream handlers
    next();
  } catch (err) {
    // Catches jwt.JsonWebTokenError and jwt.TokenExpiredError
    res.status(401);
    next(new Error('Not authorized — token invalid or expired.'));
  }
};

/**
 * `adminOnly` middleware — restricts access to admin users.
 *
 * Must be chained AFTER `protect`, which guarantees `req.user` is set.
 *
 * @type {import('express').RequestHandler}
 */
const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    res.status(403);
    return next(new Error('Forbidden — admin privileges required.'));
  }
  next();
};

module.exports = { protect, adminOnly };
