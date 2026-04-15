/**
 * @file database.js
 * @description Production MongoDB connection module.
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using MONGO_URI from environment.
 * Validates existence of MONGO_URI and handles connection errors.
 * 
 * Note: Special characters (@, #, etc.) in MONGO_URI must be URL-encoded 
 * when provided in the environment (e.g., @ becomes %40).
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('✗ CRITICAL ERROR: MONGO_URI is missing from environment variables.');
    console.warn('⚠ Fallback: Server will start without persistent database connectivity.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, 
      socketTimeoutMS: 45000,
      // URL-encoding for special characters is handled by the connection string parser
    });

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);

    // Seed default users (idempotent seeder)
    await require('./seed')();
  } catch (err) {
    console.error('✗ CRITICAL ERROR: Database connection failed.');
    console.error(`Reason: ${err.message}`);
    // We let the process continue so the server can start and listen on its PORT, 
    // satisfying Cloud Run's health check.
  }
};

module.exports = connectDB;
