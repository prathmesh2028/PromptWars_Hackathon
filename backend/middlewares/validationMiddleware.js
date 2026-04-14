/**
 * @file validationMiddleware.js
 * @description Input validation rules and sanitization using express-validator.
 *
 * Each exported array is a middleware chain that can be applied to a route.
 * The final step in each chain is `validate()`, which checks for errors
 * accumulated by previous rules and short-circuits the request if any are found.
 *
 * @example
 *   router.post('/register', validateRegister, registerUser)
 */

const { body, validationResult } = require('express-validator');

// ─── Error collector ─────────────────────────────────────────────────────────

/**
 * Reads express-validator errors from the request and sends a
 * structured 422 response if any are present.
 *
 * @type {import('express').RequestHandler}
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Validation chains ───────────────────────────────────────────────────────

/**
 * Validates & sanitizes POST /api/auth/register body.
 *
 * Rules:
 * - name:     required, 2–60 chars, letters/spaces only
 * - email:    required, valid email format, normalized to lowercase
 * - password: required, min 6 chars
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()          .withMessage('Full name is required.')
    .isLength({ min: 2, max: 60 })
                         .withMessage('Name must be between 2 and 60 characters.')
    .matches(/^[a-zA-Z\s'-]+$/)
                         .withMessage('Name may only contain letters, spaces, hyphens, or apostrophes.'),

  body('email')
    .trim()
    .notEmpty()          .withMessage('Email address is required.')
    .isEmail()           .withMessage('Please enter a valid email address.')
    .normalizeEmail(),   // lowercases, removes dots in gmail, etc.

  body('password')
    .notEmpty()          .withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    .isLength({ max: 128}).withMessage('Password must not exceed 128 characters.'),

  validate,
];

/**
 * Validates & sanitizes POST /api/auth/login body.
 *
 * Rules:
 * - email:    required, valid format
 * - password: required (no length check — we let bcrypt decide)
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()          .withMessage('Email address is required.')
    .isEmail()           .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()          .withMessage('Password is required.'),

  validate,
];

module.exports = { validateRegister, validateLogin };
