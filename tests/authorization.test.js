const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Role = require('../src/models/role.model');

beforeAll(async () => {
  await require('../src/db/mongo').connect();
  // seed roles
  await Role.create({ name: 'admin', permissions: ['*'] });
  await Role.create({ name: 'editor', permissions: ['project.create', 'project.edit'] });
  await Role.create({ name: 'publisher', permissions: ['project.publish'] });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (global.__MONGOD__) await global.__MONGOD__.stop();
});

describe('Organization and membership', () => {
  test('create organization and add member', async () => {
    // register admin
    const adminEmail = 'admin1@example.com';
    await request(app).post('/api/v1/auth/register').send({ name: 'Admin', email: adminEmail, password: 'P@ssw0rd' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'P@ssw0rd' });
    const token = login.body.data.accessToken;

    // create organization as admin
    const create = await request(app).post('/api/v1/organizations').set('Authorization', `Bearer ${token}`).send({ name: 'Demo Workspace', slug: 'demo' });
    expect(create.statusCode).toBe(201);
    const orgId = create.body.data._id;

    // register a member
    const memEmail = 'member@example.com';
    await request(app).post('/api/v1/auth/register').send({ name: 'Member', email: memEmail, password: 'P@ssw0rd' });

    // admin tries to add member -> requires manage_members permission; admin role has '*', so allowed
    const add = await request(app).post(`/api/v1/organizations/${orgId}/members`).set('Authorization', `Bearer ${token}`).send({ email: memEmail, role: 'editor' });
    expect(add.statusCode).toBe(201);
  });
});
