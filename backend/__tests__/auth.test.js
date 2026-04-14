/**
 * @file auth.test.js
 * @description Integration tests for the Authentication API.
 *
 * Tests are grouped by endpoint and cover:
 *   ✓ Happy paths (valid inputs)
 *   ✓ Validation failures (missing / malformed inputs)
 *   ✓ Business logic errors (duplicate email, wrong password)
 *   ✓ Protected route enforcement (JWT guard)
 *   ✓ Response shape assertions
 */

const request = require('supertest');
const createApp = require('../app');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('./testHelper');

// ─── Test fixtures ────────────────────────────────────────────────────────────

const VALID_USER = {
  name:     'Test User',
  email:    'test@example.com',
  password: 'password123',
};

const ADMIN_USER = {
  name:     'Admin User',
  email:    'admin@test.com',
  password: 'adminpass99',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createApp(); // Fresh Express app — no TCP binding
});

afterEach(clearTestDB); // Clean slate between each test

afterAll(disconnectTestDB);

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Registers a user and returns the parsed response body.
 * @param {object} payload - User data
 */
const registerUser = (payload) =>
  request(app).post('/api/auth/register').send(payload);

/**
 * Logs in and returns the parsed response body.
 * @param {string} email
 * @param {string} password
 */
const loginUser = (email, password) =>
  request(app).post('/api/auth/login').send({ email, password });

// ─── Health Check ─────────────────────────────────────────────────────────────

describe('GET /', () => {
  it('should return a 200 health check with service info', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('SmartVenue AI Backend');
    expect(res.body.version).toBeDefined();
  });
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {

  it('should register a new user and return 201 with a JWT', async () => {
    const res = await registerUser(VALID_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name:    VALID_USER.name,
      email:   VALID_USER.email,
      isAdmin: false,
    });
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
  });

  it('should NOT include password in the response', async () => {
    const res = await registerUser(VALID_USER);

    expect(res.body.data.password).toBeUndefined();
  });

  it('should return 409 when email is already registered', async () => {
    await registerUser(VALID_USER); // First registration
    const res = await registerUser(VALID_USER); // Duplicate

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should return 422 when name is missing', async () => {
    const res = await registerUser({ email: 'a@b.com', password: 'pass123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors[0].field).toBe('name');
  });

  it('should return 422 when email is invalid', async () => {
    const res = await registerUser({ ...VALID_USER, email: 'not-an-email' });

    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.field === 'email')).toBe(true);
  });

  it('should return 422 when password is too short (< 6 chars)', async () => {
    const res = await registerUser({ ...VALID_USER, password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.field === 'password')).toBe(true);
  });

  it('should return 422 when name contains special characters', async () => {
    const res = await registerUser({ ...VALID_USER, name: 'User<script>' });

    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.field === 'name')).toBe(true);
  });

  it('should store email as lowercase regardless of input casing', async () => {
    const res = await registerUser({ ...VALID_USER, email: 'Test@Example.COM' });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('test@example.com');
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {

  beforeEach(async () => {
    // Create user to log in against
    await registerUser(VALID_USER);
  });

  it('should login with correct credentials and return 200 with JWT', async () => {
    const res = await loginUser(VALID_USER.email, VALID_USER.password);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.email).toBe(VALID_USER.email);
  });

  it('should return 401 for a wrong password', async () => {
    const res = await loginUser(VALID_USER.email, 'wrongpassword');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should return 401 for a non-existent email', async () => {
    const res = await loginUser('nobody@nowhere.com', 'password123');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should return 422 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'pass' });

    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.field === 'email')).toBe(true);
  });

  it('should return 422 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });

    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.field === 'password')).toBe(true);
  });

  it('should login case-insensitively on email', async () => {
    const res = await loginUser('TEST@EXAMPLE.COM', VALID_USER.password);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@example.com');
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {

  let token;

  beforeEach(async () => {
    const res = await registerUser(VALID_USER);
    token = res.body.data.token;
  });

  it('should return the authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(VALID_USER.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('should return 401 for a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer totally.invalid.token');

    expect(res.status).toBe(401);
  });

  it('should return 401 for an expired / wrong-secret token', async () => {
    const fakeToken = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2UifQ.bad_sig';
    const res = await request(app).get('/api/auth/me').set('Authorization', fakeToken);

    expect(res.status).toBe(401);
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────

describe('404 handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/this/does/not/exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});
