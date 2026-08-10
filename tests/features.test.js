const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');

// New Fluit-aligned features: tasks, briefs, review lock/summarize,
// project chat, contracts, invoices.
describe('Fluit-aligned features', () => {
  let adminToken;
  let orgId;
  let projectId;
  let versionId;

  beforeAll(async () => {
    await require('../src/db/mongo').connect();
    const adminEmail = 'featadmin@example.com';
    await request(app).post('/api/v1/auth/register').send({ name: 'FeatAdmin', email: adminEmail, password: 'P@ssw0rd' });
    const login = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'P@ssw0rd' });
    adminToken = login.body.data.accessToken;

    const createOrg = await request(app).post('/api/v1/organizations').set('Authorization', `Bearer ${adminToken}`).send({ name: 'FeatureOrg', slug: 'feature-org' });
    orgId = createOrg.body.data._id;

    const createProj = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${adminToken}`).send({ organizationId: orgId, title: 'Feature Project' });
    projectId = createProj.body.data._id;

    // move project to IN_PROGRESS and add a version for review features
    await request(app).post(`/api/v1/projects/${projectId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'ASSIGNED' });
    await request(app).post(`/api/v1/projects/${projectId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'IN_PROGRESS' });
    const v = await request(app).post(`/api/v1/projects/${projectId}/versions`).set('Authorization', `Bearer ${adminToken}`).send({ changeSummary: 'first cut' });
    versionId = v.body.data._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  describe('Tasks (kanban)', () => {
    test('create, list, and transition a task', async () => {
      const create = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set(auth())
        .send({ title: 'Draft captions', description: 'Write captions for v1', priority: 'high', dueDate: '2026-09-01T00:00:00.000Z' });
      expect(create.statusCode).toBe(201);
      const taskId = create.body.data._id;
      expect(create.body.data.status).toBe('todo');

      const list = await request(app).get(`/api/v1/projects/${projectId}/tasks`).set(auth());
      expect(list.statusCode).toBe(200);
      expect(list.body.data.total).toBeGreaterThanOrEqual(1);

      const transition = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
        .set(auth())
        .send({ status: 'in_review' });
      expect(transition.statusCode).toBe(200);
      expect(transition.body.data.status).toBe('in_review');

      const update = await request(app).patch(`/api/v1/projects/${projectId}/tasks/${taskId}`).set(auth()).send({ priority: 'low' });
      expect(update.statusCode).toBe(200);
      expect(update.body.data.priority).toBe('low');

      const remove = await request(app).delete(`/api/v1/projects/${projectId}/tasks/${taskId}`).set(auth());
      expect(remove.statusCode).toBe(200);
      expect(remove.body.data.deleted).toBe(true);
    });

    test('rejects invalid task status', async () => {
      const create = await request(app).post(`/api/v1/projects/${projectId}/tasks`).set(auth()).send({ title: 'Invalid' });
      const taskId = create.body.data._id;
      const bad = await request(app).post(`/api/v1/projects/${projectId}/tasks/${taskId}/status`).set(auth()).send({ status: 'nope' });
      expect(bad.statusCode).toBe(400);
    });
  });

  describe('Brief', () => {
    test('upsert and fetch a structured brief', async () => {
      const put = await request(app)
        .put(`/api/v1/projects/${projectId}/brief`)
        .set(auth())
        .send({
          goal: 'Launch promo video',
          targetAudience: 'SMB founders',
          references: ['https://example.com/ref'],
          deliverables: ['60s cut', 'social teaser'],
          deadline: '2026-10-01T00:00:00.000Z',
        });
      expect(put.statusCode).toBe(200);
      expect(put.body.data.goal).toBe('Launch promo video');
      expect(put.body.data.deliverables).toHaveLength(2);

      const get = await request(app).get(`/api/v1/projects/${projectId}/brief`).set(auth());
      expect(get.statusCode).toBe(200);
      expect(get.body.data.references[0]).toBe('https://example.com/ref');
    });
  });

  describe('Review lock + summarize', () => {
    test('summarize feedback and lock it into a revision scope', async () => {
      // add two feedback comments on the version
      await request(app).post(`/api/v1/projects/${projectId}/comments`).set(auth()).send({ versionId, body: 'Please cool down the color grading on the product shot.' });
      await request(app).post(`/api/v1/projects/${projectId}/comments`).set(auth()).send({ versionId, body: 'Can we tighten the audio sync at 0:42?' });

      const summarize = await request(app).post(`/api/v1/projects/${projectId}/reviews/summarize`).set(auth()).send({ versionId });
      expect(summarize.statusCode).toBe(200);
      expect(summarize.body.data.totalComments).toBe(2);
      expect(summarize.body.data.actionItems.length).toBeGreaterThanOrEqual(2);

      const lock = await request(app).post(`/api/v1/projects/${projectId}/reviews/lock`).set(auth()).send({ versionId });
      expect(lock.statusCode).toBe(201);
      expect(lock.body.data.lockedCommentCount).toBe(2);
      expect(lock.body.data.revision.source).toBe('review_lock');
      expect(lock.body.data.revision.scopeItems).toHaveLength(2);
      expect(lock.body.data.revision.reason).toContain('Action items');
    });

    test('lock fails when there is no unresolved feedback', async () => {
      const res = await request(app).post(`/api/v1/projects/${projectId}/reviews/lock`).set(auth()).send({ versionId });
      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('no_feedback');
    });
  });

  describe('Project chat', () => {
    test('create channel, post message and threaded reply', async () => {
      const channel = await request(app).post(`/api/v1/projects/${projectId}/channels`).set(auth()).send({ name: 'feedback' });
      expect(channel.statusCode).toBe(201);
      const channelId = channel.body.data._id;

      const msg = await request(app).post(`/api/v1/projects/${projectId}/channels/${channelId}/messages`).set(auth()).send({ body: 'Opening shot feels right.' });
      expect(msg.statusCode).toBe(201);

      const reply = await request(app)
        .post(`/api/v1/projects/${projectId}/channels/${channelId}/messages`)
        .set(auth())
        .send({ body: 'Linking to the note.', parentId: msg.body.data._id });
      expect(reply.statusCode).toBe(201);
      expect(reply.body.data.parentId).toBe(msg.body.data._id);

      // top-level listing excludes thread replies
      const list = await request(app).get(`/api/v1/projects/${projectId}/channels/${channelId}/messages`).set(auth());
      expect(list.statusCode).toBe(200);
      expect(list.body.data.total).toBe(1);

      // thread listing returns the reply
      const thread = await request(app)
        .get(`/api/v1/projects/${projectId}/channels/${channelId}/messages`)
        .query({ parentId: msg.body.data._id })
        .set(auth());
      expect(thread.statusCode).toBe(200);
      expect(thread.body.data.total).toBe(1);
      expect(thread.body.data.items[0].body).toBe('Linking to the note.');
    });
  });

  describe('Contracts', () => {
    test('create -> send -> view -> sign lifecycle', async () => {
      const create = await request(app)
        .post(`/api/v1/organizations/${orgId}/contracts`)
        .set(auth())
        .send({ title: 'Production Agreement', amount: 4800, currency: 'USD', terms: 'Standard terms', projectId });
      expect(create.statusCode).toBe(201);
      expect(create.body.data.status).toBe('draft');
      const contractId = create.body.data._id;

      const send = await request(app).post(`/api/v1/organizations/${orgId}/contracts/${contractId}/send`).set(auth());
      expect(send.statusCode).toBe(200);
      expect(send.body.data.status).toBe('sent');

      const view = await request(app).post(`/api/v1/organizations/${orgId}/contracts/${contractId}/view`).set(auth());
      expect(view.statusCode).toBe(200);
      expect(view.body.data.status).toBe('viewed');

      const sign = await request(app)
        .post(`/api/v1/organizations/${orgId}/contracts/${contractId}/sign`)
        .set(auth())
        .send({ signerName: 'Maya Chen', signerEmail: 'maya@client.co' });
      expect(sign.statusCode).toBe(200);
      expect(sign.body.data.status).toBe('signed');
      expect(sign.body.data.signerName).toBe('Maya Chen');
    });

    test('cannot edit a signed contract', async () => {
      const create = await request(app).post(`/api/v1/organizations/${orgId}/contracts`).set(auth()).send({ title: 'Locked Terms' });
      const contractId = create.body.data._id;
      await request(app).post(`/api/v1/organizations/${orgId}/contracts/${contractId}/sign`).set(auth()).send({ signerName: 'A', signerEmail: 'a@b.co' });
      const edit = await request(app).patch(`/api/v1/organizations/${orgId}/contracts/${contractId}`).set(auth()).send({ amount: 1 });
      expect(edit.statusCode).toBe(400);
      expect(edit.body.error.code).toBe('contract_not_editable');
    });
  });

  describe('Invoices', () => {
    test('create -> send -> pay and outstanding query', async () => {
      const create = await request(app)
        .post(`/api/v1/organizations/${orgId}/invoices`)
        .set(auth())
        .send({ number: 'INV-0001', amount: 1500, currency: 'USD', projectId });
      expect(create.statusCode).toBe(201);
      const invoiceId = create.body.data._id;

      const send = await request(app).post(`/api/v1/organizations/${orgId}/invoices/${invoiceId}/send`).set(auth());
      expect(send.statusCode).toBe(200);
      expect(send.body.data.status).toBe('sent');

      const outstanding = await request(app).get(`/api/v1/organizations/${orgId}/invoices/outstanding`).set(auth());
      expect(outstanding.statusCode).toBe(200);
      expect(outstanding.body.data.totalOutstanding).toBe(1500);

      const pay = await request(app).post(`/api/v1/organizations/${orgId}/invoices/${invoiceId}/pay`).set(auth()).send({ paymentMethod: 'stripe' });
      expect(pay.statusCode).toBe(200);
      expect(pay.body.data.status).toBe('paid');

      const after = await request(app).get(`/api/v1/organizations/${orgId}/invoices/outstanding`).set(auth());
      expect(after.body.data.totalOutstanding).toBe(0);
    });
  });

  describe('User profile & my organizations', () => {
    test('GET /users/me/organizations lists the orgs the user belongs to', async () => {
      const res = await request(app).get('/api/v1/users/me/organizations').set(auth());
      expect(res.statusCode).toBe(200);
      const mine = res.body.data;
      expect(Array.isArray(mine)).toBe(true);
      expect(mine.some((m) => m.organization._id === orgId && m.role === 'admin')).toBe(true);
    });

    test('PATCH /users/me updates name and email', async () => {
      const newEmail = `featprofile-${Date.now()}@example.com`;
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set(auth())
        .send({ name: 'Feat Admin Renamed', email: newEmail });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Feat Admin Renamed');
      expect(res.body.data.email).toBe(newEmail);

      // /me reflects the change
      const me = await request(app).get('/api/v1/users/me').set(auth());
      expect(me.body.data.name).toBe('Feat Admin Renamed');
    });

    test('PATCH /users/me with an empty body is a 400', async () => {
      const res = await request(app).patch('/api/v1/users/me').set(auth()).send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    });

    test('PATCH /users/me cannot take another user\'s email (409)', async () => {
      const otherEmail = 'featother@example.com';
      await request(app).post('/api/v1/auth/register').send({ name: 'Other', email: otherEmail, password: 'P@ssw0rd' });
      const res = await request(app).patch('/api/v1/users/me').set(auth()).send({ email: otherEmail });
      expect(res.statusCode).toBe(409);
      expect(res.body.error.code).toBe('email_in_use');
    });
  });
});
