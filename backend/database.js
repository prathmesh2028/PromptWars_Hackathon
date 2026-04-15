/**
 * @file database.js
 * @description MongoDB connection module.
 *
 * Strategy (in priority order):
 *   1. If MONGO_URI is set → connect to that URI (Atlas, Docker, self-hosted)
 *   2. Otherwise           → spin up MongoMemoryServer (local dev / testing)
 *
 * On startup it:
 *   1. Establishes the Mongoose connection
 *   2. Seeds default users (idempotent — won't re-seed if data already exists)
 *
 * To use a real MongoDB:
 *   Set MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartvenue
 */

const mongoose             = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Connects to MongoDB using MONGO_URI env var or in-memory fallback.
 * Exits the process on connection failure.
 */
const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    if (uri) {
      // ── Real MongoDB (production / staging) ──────────────────────────────
      console.log('✓ Using external MongoDB URI from MONGO_URI env var');
    } else {
      // ── In-memory MongoDB (local development) ────────────────────────────
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          '⚠ Warning: Running with in-memory MongoDB in production mode. ' +
          'Set MONGO_URI for persistent storage.'
        );
      }
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log('✓ Using in-memory MongoDB (MongoMemoryServer)');
    }

    const conn = await mongoose.connect(uri, {
      // Recommended options for Mongoose 7+
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);

    // Seed default users (no-op if already seeded)
    await require('./seed')();
  } catch (err) {
    console.error(`✗ Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

