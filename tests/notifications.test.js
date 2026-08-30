/**
 * Test that notifications from the backend are properly normalized
 * (Mongoose _id → frontend id) before being consumed by the UI.
 */
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Role = require('../src/models/role.model');
const Notification = require('../src/models/notification.model');
const User = require('../src/models/user.model');
const Organization = require('../src/models/organization.model');
const Membership = require('../src/models/membership.model');

describe('Notifications API normalization', () => {
  let token, userId, orgId;

  beforeAll(async () => {
    await require('../src/db/mongo').connect();
    await Role.create({ name: 'admin', permissions: ['*'] });

    // Register + login
    await request(app).post('/api/v1/auth/register').send({
      name: 'NotifTest',
      email: 'notiftest@example.com',
      password: 'P@ssw0rd',
    });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'notiftest@example.com',
      password: 'P@ssw0rd',
    });
    token = login.body.data.accessToken;
    userId = login.body.data.user._id;

    // Create org + membership
    const org = await request(app).post('/api/v1/organizations').set('Authorization', `Bearer ${token}`).send({
      name: 'NotifOrg',
      slug: 'notiforg',
    });
    orgId = org.body.data._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  test('notification response includes id (not _id)', async () => {
    // Create a notification directly
    await Notification.create({
      userId,
      type: 'test_type',
      title: 'Test Notification',
      body: 'This is a test',
    });

    const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // The frontend expects `id`, not `_id`
    const notif = res.body.data[0];
    expect(notif).toHaveProperty('id'); // This will fail if backend still uses _id
    // The _id should be normalized to id
    expect(typeof notif.id).toBe('string');
  });

  test('mark-all-read endpoint works', async () => {
    await request(app).post('/api/v1/notifications').set('Authorization', `Bearer ${token}`).send({}); // no-op
    const res = await request(app).patch('/api/v1/notifications/read-all').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});
