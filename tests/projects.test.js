const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Role = require('../src/models/role.model');

beforeAll(async () => {
  await require('../src/db/mongo').connect();
  await Role.create({ name: 'admin', permissions: ['*'] });
  await Role.create({ name: 'approver', permissions: ['project.approve', 'project.view'] });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (global.__MONGOD__) await global.__MONGOD__.stop();
});

describe('Project lifecycle', () => {
  test('create project, add version, approve exact version', async () => {
    const adminEmail = 'projadmin@example.com';
    await request(app).post('/api/v1/auth/register').send({ name: 'ProjAdmin', email: adminEmail, password: 'P@ssw0rd' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'P@ssw0rd' });
    const token = login.body.data.accessToken;

    // create org
    const createOrg = await request(app).post('/api/v1/organizations').set('Authorization', `Bearer ${token}`).send({ name: 'OrgX', slug: 'orgx' });
    const orgId = createOrg.body.data._id;

    // create project
    const create = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${token}`).send({ organizationId: orgId, title: 'New Project', description: 'desc' });
    expect(create.statusCode).toBe(201);
    const projectId = create.body.data._id;

    // transition to ASSIGNED then IN_PROGRESS
    await request(app).post(`/api/v1/projects/${projectId}/transition`).set('Authorization', `Bearer ${token}`).send({ status: 'ASSIGNED' });
    await request(app).post(`/api/v1/projects/${projectId}/transition`).set('Authorization', `Bearer ${token}`).send({ status: 'IN_PROGRESS' });

    // add version
    const v = await request(app).post(`/api/v1/projects/${projectId}/versions`).set('Authorization', `Bearer ${token}`).send({ metadata: { filename: 'draft.mp4' }, changeSummary: 'first draft' });
    expect(v.statusCode).toBe(201);
    const versionId = v.body.data._id;

    // seed approver user and membership
    const approverEmail = 'approver@example.com';
    await request(app).post('/api/v1/auth/register').send({ name: 'Approver', email: approverEmail, password: 'P@ssw0rd' });
    const alog = await request(app).post('/api/v1/auth/login').send({ email: approverEmail, password: 'P@ssw0rd' });
    const atoken = alog.body.data.accessToken;
    // make approver member of org and role approver
    // admin adds member
    await request(app).post(`/api/v1/organizations/${orgId}/members`).set('Authorization', `Bearer ${token}`).send({ email: approverEmail, role: 'approver' });

    // approver approves exact version
    const appRes = await request(app).post(`/api/v1/projects/${projectId}/approve`).set('Authorization', `Bearer ${atoken}`).send({ versionId });
    expect(appRes.statusCode).toBe(200);
    expect(appRes.body.data).toHaveProperty('approvedVersionId');
    expect(appRes.body.data.status).toBe('APPROVED');
  });
});
