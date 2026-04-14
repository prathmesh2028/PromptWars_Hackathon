/**
 * @file auth.js
 * @description Authentication routes.
 *
 * Public routes:
 *   POST /api/auth/register  — create a new account
 *   POST /api/auth/login     — authenticate and receive JWT
 *
 * Protected routes:
 *   GET  /api/auth/me        — return the current user's profile
 */

const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect }                        = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Public
router.post('/register', validateRegister, registerUser);
router.post('/login',    validateLogin,    loginUser);

// Protected — requires valid JWT
router.get('/me', protect, getMe);

module.exports = router;
