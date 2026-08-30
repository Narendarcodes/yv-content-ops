/**
 * TDD for the org-wide activity feed.
 *
 * Bug: the dashboard "Recent activity" card renders the user's
 * NOTIFICATIONS instead of real activity. The DB holds real ActivityEvent
 * documents (608 in dev) but the only endpoint is per-project
 * (/projects/:id/activity) — there is no org-wide route, so the dashboard
 * cannot show a true cross-project feed.
 *
 * Contract under test: GET /organizations/:organizationId/activity
 * returns the most recent events across ALL projects in the org,
 * newest first, with actor + project populated, gated by org membership.
 */
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Role = require('../src/models/role.model');
const Project = require('../src/models/project.model');
const ActivityEvent = require('../src/models/activityEvent.model');

describe('Org-wide activity feed', () => {
  let token, orgId, projectIdA, projectIdB;

  beforeAll(async () => {
    await require('../src/db/mongo').connect();
    await Role.create({ name: 'admin', permissions: ['*'] });

    const email = `activity${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/register').send({ name: 'FeedTest', email, password: 'P@ssw0rd' });
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'P@ssw0rd' });
    token = login.body.data.accessToken;
    const me = login.body.data.user._id;

    const org = await request(app).post('/api/v1/organizations').set('Authorization', `Bearer ${token}`).send({ name: 'FeedOrg', slug: `feedorg${Date.now()}` });
    orgId = org.body.data._id;

    const pA = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${token}`).send({ title: 'Feed Project A', organizationId: orgId });
    projectIdA = pA.body.data._id;
    const pB = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${token}`).send({ title: 'Feed Project B', organizationId: orgId });
    projectIdB = pB.body.data._id;

    // Seed events in both projects — B newer than A so we can assert ordering
    await ActivityEvent.create({ projectId: projectIdA, actor: me, action: 'created', metadata: {} });
    await new Promise((r) => setTimeout(r, 30));
    await ActivityEvent.create({ projectId: projectIdB, actor: me, action: 'version_uploaded', metadata: { label: 'v2' } });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  test('RED: GET /organizations/:id/activity returns events across ALL org projects, newest first', async () => {
    const res = await request(app)
      .get(`/api/v1/organizations/${orgId}/activity`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    const events = res.body.data;
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThanOrEqual(2);
    // Both projects represented
    const projectIds = events.map((e) => String(e.projectId?._id ?? e.projectId));
    expect(projectIds).toContain(String(projectIdA));
    expect(projectIds).toContain(String(projectIdB));
    // Newest first
    expect(new Date(events[0].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(events[1].createdAt).getTime());
    // Populated actor + project titles for the UI
    expect(events[0].projectId).toHaveProperty('title');
    expect(events[0].actor).toHaveProperty('name');
  });

  test('respects ?limit=', async () => {
    const res = await request(app)
      .get(`/api/v1/organizations/${orgId}/activity?limit=1`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test('non-members are rejected (403)', async () => {
    // Another user not in the org
    const email2 = `outsider${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/register').send({ name: 'Outsider', email: email2, password: 'P@ssw0rd' });
    const login2 = await request(app).post('/api/v1/auth/login').send({ email: email2, password: 'P@ssw0rd' });
    const outsiderToken = login2.body.data.accessToken;
    const res = await request(app)
      .get(`/api/v1/organizations/${orgId}/activity`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(res.statusCode).toBe(403);
  });
});
