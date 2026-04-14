/**
 * @file seed.js
 * @description Idempotent database seeder.
 *
 * Exports an async function (not a script) so it can be called from database.js
 * after the connection is established.
 *
 * Will NOT re-seed if users already exist — safe to call on every boot.
 *
 * Default accounts:
 *   admin@smartvenue.ai  / password123  (isAdmin: true)
 *   john@example.com     / password123  (isAdmin: false)
 */

const User = require('./models/User');

/**
 * Seeds the database with default users if the collection is empty.
 * @returns {Promise<void>}
 */
const seed = async () => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return; // Already seeded — skip

    const defaultUsers = [
      {
        name:     'Admin User',
        email:    'admin@smartvenue.ai',
        password: 'password123',
        isAdmin:  true,
      },
      {
        name:     'John Doe',
        email:    'john@example.com',
        password: 'password123',
        isAdmin:  false,
      },
    ];

    // insertMany does NOT trigger pre-save hooks, so we create individually
    // to ensure passwords are properly hashed.
    for (const userData of defaultUsers) {
      await User.create(userData);
    }

    console.log('✓ Database seeded — admin@smartvenue.ai / password123');
  } catch (err) {
    console.error(`✗ Seed error: ${err.message}`);
  }
};

module.exports = seed;
