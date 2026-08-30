/**
 * Tests for cookie-based JWT fallback in the authenticate middleware.
 *
 * RED state: without cookie-parser + cookie fallback in authenticate,
 * passing a JWT via cookie (no Authorization header) returns 401 or 500.
 *
 * GREEN state: after installing cookie-parser and adding the cookie fallback,
 * the same request returns 200 with user data.
 */
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Role = require('../src/models/role.model');

describe('authenticate middleware — cookie JWT fallback', () => {
  let token;

  beforeAll(async () => {
    await require('../src/db/mongo').connect();
    await Role.create({ name: 'admin', permissions: ['*'] });

    await request(app).post('/api/v1/auth/register').send({
      name: 'CookieTest',
      email: 'cookietest@example.com',
      password: 'P@ssw0rd',
    });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'cookietest@example.com',
      password: 'P@ssw0rd',
    });
    token = login.body.data.accessToken;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  test('Authorization header path still works (baseline)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('email', 'cookietest@example.com');
  });

  test('Cookie-based JWT is accepted without Authorization header (RED before fix)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`accessToken=${token}`]);

    // After the fix, this must return 200 (not 401/500)
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('email', 'cookietest@example.com');
  });
});
