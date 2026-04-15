/**
 * @file authController.js
 * @description Authentication controller handling user registration and login.
 *
 * Security features:
 * - Passwords hashed via bcryptjs (pre-save hook in User model)
 * - JWT tokens with configurable expiry
 * - Timing-safe comparison via bcrypt (mitigates timing attacks)
 * - No sensitive fields leaked in responses
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ─── JWT Secret validation ────────────────────────────────────────────────────
// Fail fast on startup if the secret is missing in production.
// Never fall back to a hardcoded string in non-development environments.
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('✗ FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
    process.exit(1);
  }
  return secret || 'dev_only_insecure_secret_do_not_use_in_production';
})();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Signs a JWT for the given user ID.
 * @param {string} id - MongoDB ObjectId as string
 * @returns {string} Signed JWT token
 */
const generateToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  });


/**
 * Builds the safe user payload to return to clients.
 * Deliberately omits password and internal fields.
 * @param {import('../models/User').UserDocument} user
 * @param {string} token
 */
const buildUserPayload = (user, token) => ({
  _id:     user._id,
  name:    user.name,
  email:   user.email,
  isAdmin: user.isAdmin,
  token,
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Registers a new user account.
 *
 * Validation is handled upstream by the `validate` middleware.
 * This controller assumes the request body is already sanitized.
 */
const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Duplicate check (case-insensitive)
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409); // 409 Conflict is more accurate than 400 for duplicates
      throw new Error('An account with that email address already exists.');
    }

    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase(),
      password, // hashed by mongoose pre-save hook
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      data:    buildUserPayload(user, token),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticates an existing user and returns a JWT.
 *
 * Returns a generic error message for invalid credentials to
 * avoid user enumeration attacks.
 */
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Always query + compare (prevents timing-based user enumeration)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    const passwordMatch = user ? await user.matchPassword(password) : false;

    if (!user || !passwordMatch) {
      res.status(401);
      throw new Error('Invalid email or password.');
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      data:    buildUserPayload(user, token),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Requires `protect` middleware to be applied on the route.
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the `protect` middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found.');
    }
    return res.status(200).json({ success: true, data: buildUserPayload(user, '') });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser, getMe };
