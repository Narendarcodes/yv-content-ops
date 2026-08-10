const request = require('supertest');
const app = require('../src/app');

describe('GET /api/v1/health', () => {
  test('returns 200 and status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
