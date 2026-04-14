/**
 * @file User.js
 * @description Mongoose schema for SmartVenue AI users.
 *
 * Security notes:
 * - Password is excluded from all queries by default (`select: false`)
 *   and must be explicitly requested with `.select('+password')`.
 * - Password is hashed via bcryptjs (cost factor 12) in a pre-save hook.
 * - `matchPassword` uses bcrypt.compare — constant-time, safe against timing attacks.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/** @type {import('mongoose').Schema} */
const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required.'],
      trim:      true,
      minlength: [2,   'Name must be at least 2 characters.'],
      maxlength: [60,  'Name must not exceed 60 characters.'],
    },

    email: {
      type:      String,
      required:  [true,  'Email is required.'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address.',
      ],
    },

    password: {
      type:      String,
      required:  [true, 'Password is required.'],
      minlength: [6,    'Password must be at least 6 characters.'],
      maxlength: [128,  'Password must not exceed 128 characters.'],
      select:    false, // Never returned in queries unless explicitly requested
    },

    isAdmin: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// ─── Instance method ──────────────────────────────────────────────────────────

/**
 * Compares a plain-text password against the stored hash.
 * Uses bcrypt.compare — safe against timing attacks.
 *
 * @param {string} enteredPassword - Plain-text password from the request
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ─── Pre-save hook ────────────────────────────────────────────────────────────

/**
 * Hashes the password before saving if it was modified.
 * Uses bcrypt with cost factor 12 (good balance of security vs. speed).
 * Skips hashing if the password field wasn't touched (e.g. name/email updates).
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const SALT_ROUNDS = 12;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

module.exports = mongoose.model('User', userSchema);
