const mongoose = require('mongoose');

/**
 * Connects to the test database using TEST_MONGO_URI or MONGO_URI.
 */
const connectTestDB = async () => {
  const uri = process.env.TEST_MONGO_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠ Skipping DB connection for tests: No TEST_MONGO_URI provided.');
    return;
  }
  await mongoose.connect(uri);
};

const clearTestDB = async () => {
  if (mongoose.connection.readyState === 0) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const disconnectTestDB = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
};

module.exports = { connectTestDB, clearTestDB, disconnectTestDB };
