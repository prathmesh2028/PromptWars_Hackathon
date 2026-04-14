/**
 * @file testHelper.js
 * @description Shared Jest setup: boots an isolated MongoMemoryServer for each
 * test suite, connects Mongoose, and tears everything down afterward.
 *
 * Usage: import at the top of any test file that needs DB access.
 *
 *   const { connectTestDB, disconnectTestDB, clearTestDB } = require('./testHelper');
 *   beforeAll(connectTestDB);
 *   afterEach(clearTestDB);     // reset state between tests (optional)
 *   afterAll(disconnectTestDB);
 */

const mongoose            = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Spins up an isolated MongoMemoryServer and connects Mongoose.
 * Call in `beforeAll`.
 */
const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

/**
 * Drops all collections — useful for resetting state between tests.
 * Call in `afterEach` if tests share state.
 */
const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Stops the in-memory server and closes the Mongoose connection.
 * Call in `afterAll`.
 */
const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

module.exports = { connectTestDB, clearTestDB, disconnectTestDB };
