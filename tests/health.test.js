const request = require('supertest');
const app = require('../src/app');

afterAll(async () => {
  // health.test.js runs without a DB connection, but with --runInBand the
  // last suite must still stop the in-memory mongod started by tests/setup.js,
  // otherwise Jest hangs on open handles.
  if (global.__MONGOD__) await global.__MONGOD__.stop();
});

describe('GET /api/v1/health', () => {
  test('returns 200 and status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
