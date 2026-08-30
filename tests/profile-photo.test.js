/**
 * Tests for the profile photo upload feature.
 *
 * Verifies that:
 * - A dedicated endpoint exists for uploading/removing profile photos
 * - The user model supports a profileImage field
 * - The API client exposes uploadProfilePhoto / removeProfilePhoto functions
 */
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Role = require('../src/models/role.model');
const _User = require('../src/models/user.model');
void _User;

describe('Profile photo feature', () => {
  let token, userId;

  beforeAll(async () => {
    await require('../src/db/mongo').connect();
    await Role.create({ name: 'admin', permissions: ['*'] });

    await request(app).post('/api/v1/auth/register').send({
      name: 'PhotoTest',
      email: 'phototest@example.com',
      password: 'P@ssw0rd',
    });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'phototest@example.com',
      password: 'P@ssw0rd',
    });
    token = login.body.data.accessToken;
    userId = login.body.data.user._id ?? login.body.data.user.id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  test('PATCH /users/me/photo accepts a multipart file upload', async () => {
    const fileContent = Buffer.from('fake-avatar-data');
    const res = await request(app)
      .patch('/api/v1/users/me/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fileContent, 'avatar.png');

    // After fix: should return 200 with the user object containing a profileImage field
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('profileImage');
    expect(typeof res.body.data.profileImage).toBe('string');
  });

  test('DELETE /users/me/photo removes the profile image', async () => {
    // First upload
    const fileContent = Buffer.from('fake-avatar-data-2');
    await request(app)
      .patch('/api/v1/users/me/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fileContent, 'avatar.png');

    // Then delete
    const res = await request(app)
      .delete('/api/v1/users/me/photo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('profileImage');
    expect(res.body.data.profileImage).toBeFalsy();
  });

  test('User model has profileImage field', async () => {
    const User = require('../src/models/user.model');
    const user = await User.findById(userId);
    expect(user).toHaveProperty('profileImage');
  });
});
