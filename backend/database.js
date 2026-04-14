/**
 * @file database.js
 * @description MongoDB connection module.
 *
 * Uses `mongodb-memory-server` to spin up an in-process MongoDB instance,
 * removing the need for a locally installed MongoDB service.
 *
 * On startup it:
 *   1. Boots the in-memory MongoDB engine
 *   2. Connects Mongoose to it
 *   3. Seeds default users (idempotent — won't re-seed if data exists)
 *
 * For a real deployment, replace MongoMemoryServer with a MONGO_URI env variable.
 */

const mongoose            = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Boots the in-memory database and connects Mongoose.
 * Exits the process on connection failure to prevent a partially-started server.
 */
const connectDB = async () => {
  try {
    // Spin up ephemeral MongoDB instance
    const mongoServer = await MongoMemoryServer.create();
    const uri         = mongoServer.getUri();

    const conn = await mongoose.connect(uri);
    console.log(`✓ MongoDB connected: ${conn.connection.host} (in-memory)`);

    // Seed default users (no-op if already seeded)
    await require('./seed')();
  } catch (err) {
    console.error(`✗ Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
