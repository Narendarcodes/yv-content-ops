const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Role = require('../src/models/role.model');

async function registerAndLogin(name, email) {
  await request(app).post('/api/v1/auth/register').send({ name, email, password: 'P@ssw0rd' });
  const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'P@ssw0rd' });
  return { token: login.body.data.accessToken, userId: login.body.data.user._id };
}

beforeAll(async () => {
  await require('../src/db/mongo').connect();
  await Role.create({ name: 'admin', permissions: ['*'] });
  await Role.create({
    name: 'editor',
    permissions: ['project.create', 'project.transition', 'project.assign', 'project.upload_version', 'project.comment', 'project.revision', 'project.view'],
  });
  await Role.create({ name: 'reviewer', permissions: ['project.view', 'project.comment', 'project.revision', 'project.approve'] });
  await Role.create({ name: 'publisher', permissions: ['project.view', 'project.schedule', 'project.publish', 'project.metrics'] });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (global.__MONGOD__) await global.__MONGOD__.stop();
});

describe('Full content-project workflow', () => {
  test('concept -> assignment -> inputs -> draft -> review -> revision -> approval -> schedule -> publish -> metrics', async () => {
    // --- setup actors ---
    const admin = await registerAndLogin('Admin', 'wf-admin@example.com');
    const editor = await registerAndLogin('Editor', 'wf-editor@example.com');
    const reviewer = await registerAndLogin('Reviewer', 'wf-reviewer@example.com');
    const publisher = await registerAndLogin('Publisher', 'wf-publisher@example.com');

    // create org as admin
    const orgRes = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'WF Org', slug: 'wforg' });
    expect(orgRes.statusCode).toBe(201);
    const orgId = orgRes.body.data._id;

    // add members
    await request(app).post(`/api/v1/organizations/${orgId}/members`).set('Authorization', `Bearer ${admin.token}`).send({ email: 'wf-editor@example.com', role: 'editor' });
    await request(app).post(`/api/v1/organizations/${orgId}/members`).set('Authorization', `Bearer ${admin.token}`).send({ email: 'wf-reviewer@example.com', role: 'reviewer' });
    await request(app).post(`/api/v1/organizations/${orgId}/members`).set('Authorization', `Bearer ${admin.token}`).send({ email: 'wf-publisher@example.com', role: 'publisher' });

    // --- create project (editor) ---
    const create = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${editor.token}`)
      .send({ organizationId: orgId, title: 'WF Video', description: 'test', type: 'production' });
    expect(create.statusCode).toBe(201);
    expect(create.body.data.status).toBe('IDEA');
    const projectId = create.body.data._id;

    // --- assign to editor (auto -> ASSIGNED) ---
    const assign = await request(app)
      .post(`/api/v1/projects/${projectId}/assign`)
      .set('Authorization', `Bearer ${editor.token}`)
      .send({ assigneeId: editor.userId });
    expect(assign.statusCode).toBe(200);
    expect(assign.body.data.status).toBe('ASSIGNED');

    // --- request inputs (-> WAITING_FOR_INPUTS) ---
    const toWaiting = await request(app)
      .post(`/api/v1/projects/${projectId}/transition`)
      .set('Authorization', `Bearer ${editor.token}`)
      .send({ status: 'WAITING_FOR_INPUTS' });
    expect(toWaiting.statusCode).toBe(200);

    // create two inputs and receive both (auto -> INPUTS_READY)
    const in1 = await request(app).post(`/api/v1/projects/${projectId}/inputs`).set('Authorization', `Bearer ${editor.token}`).send({ title: 'Voiceover', owner: editor.userId });
    const in2 = await request(app).post(`/api/v1/projects/${projectId}/inputs`).set('Authorization', `Bearer ${editor.token}`).send({ title: 'Footage' });
    expect(in1.statusCode).toBe(201);
    expect(in2.statusCode).toBe(201);
    const inputId1 = in1.body.data._id;
    const inputId2 = in2.body.data._id;

    await request(app).patch(`/api/v1/projects/${projectId}/inputs/${inputId1}`).set('Authorization', `Bearer ${editor.token}`).send({ state: 'received' });
    const afterFirstInput = await request(app).get(`/api/v1/projects/${projectId}`).set('Authorization', `Bearer ${editor.token}`).query({ organizationId: orgId });
    expect(afterFirstInput.body.data.status).toBe('WAITING_FOR_INPUTS'); // still waiting

    const readyRes = await request(app).patch(`/api/v1/projects/${projectId}/inputs/${inputId2}`).set('Authorization', `Bearer ${editor.token}`).send({ state: 'received' });
    expect(readyRes.statusCode).toBe(200);
    const afterInputs = await request(app).get(`/api/v1/projects/${projectId}`).set('Authorization', `Bearer ${editor.token}`).query({ organizationId: orgId });
    expect(afterInputs.body.data.status).toBe('INPUTS_READY');

    // --- start work (-> IN_PROGRESS) ---
    await request(app).post(`/api/v1/projects/${projectId}/transition`).set('Authorization', `Bearer ${editor.token}`).send({ status: 'IN_PROGRESS' });

    // --- upload first draft (auto -> FIRST_DRAFT_SUBMITTED) ---
    const draft = await request(app)
      .post(`/api/v1/projects/${projectId}/versions`)
      .set('Authorization', `Bearer ${editor.token}`)
      .send({ metadata: { filename: 'draft.mp4' }, changeSummary: 'first cut' });
    expect(draft.statusCode).toBe(201);
    const draftVersionId = draft.body.data._id;
    const afterDraft = await request(app).get(`/api/v1/projects/${projectId}`).set('Authorization', `Bearer ${editor.token}`).query({ organizationId: orgId });
    expect(afterDraft.body.data.status).toBe('FIRST_DRAFT_SUBMITTED');

    // --- reviewer comments ---
    const comment = await request(app)
      .post(`/api/v1/projects/${projectId}/comments`)
      .set('Authorization', `Bearer ${reviewer.token}`)
      .send({ versionId: draftVersionId, body: 'Please tighten the intro' });
    expect(comment.statusCode).toBe(201);

    // --- reviewer requests revision (-> REVISION_REQUESTED) ---
    const revReq = await request(app)
      .post(`/api/v1/projects/${projectId}/revisions`)
      .set('Authorization', `Bearer ${reviewer.token}`)
      .send({ sourceVersionId: draftVersionId, reason: 'Intro too long' });
    expect(revReq.statusCode).toBe(201);
    const revisionId = revReq.body.data._id;
    expect(revReq.body.data.revisionNumber).toBe(1);

    // --- editor starts revision (-> REVISION_IN_PROGRESS) ---
    await request(app).patch(`/api/v1/projects/${projectId}/revisions/${revisionId}`).set('Authorization', `Bearer ${editor.token}`).send({ status: 'in_progress' });

    // --- editor uploads revised version (auto -> REVISION_SUBMITTED) ---
    const revised = await request(app)
      .post(`/api/v1/projects/${projectId}/versions`)
      .set('Authorization', `Bearer ${editor.token}`)
      .send({ metadata: { filename: 'revised.mp4' }, changeSummary: 'tightened intro' });
    expect(revised.statusCode).toBe(201);
    const revisedVersionId = revised.body.data._id;
    const afterRevised = await request(app).get(`/api/v1/projects/${projectId}`).set('Authorization', `Bearer ${editor.token}`).query({ organizationId: orgId });
    expect(afterRevised.body.data.status).toBe('REVISION_SUBMITTED');
    expect(afterRevised.body.data.revisionCount).toBe(1);

    // --- reviewer approves exact version (-> APPROVED) ---
    const approve = await request(app)
      .post(`/api/v1/projects/${projectId}/approve`)
      .set('Authorization', `Bearer ${reviewer.token}`)
      .send({ versionId: revisedVersionId });
    expect(approve.statusCode).toBe(200);
    expect(approve.body.data.status).toBe('APPROVED');
    expect(approve.body.data.approvedVersionId.toString()).toBe(revisedVersionId);

    // --- cannot publish without schedule? schedule first (-> SCHEDULED) ---
    const schedule = await request(app)
      .post(`/api/v1/projects/${projectId}/schedule`)
      .set('Authorization', `Bearer ${publisher.token}`)
      .send({ scheduledAt: '2026-08-15T09:00:00.000Z' });
    expect(schedule.statusCode).toBe(200);
    expect(schedule.body.data.status).toBe('SCHEDULED');

    // --- publisher records publication (-> PUBLISHED) ---
    const publish = await request(app)
      .post(`/api/v1/projects/${projectId}/publications`)
      .set('Authorization', `Bearer ${publisher.token}`)
      .send({ platform: 'YouTube', postUrl: 'https://youtube.com/watch?v=abc123', postId: 'abc123' });
    expect(publish.statusCode).toBe(201);
    const publicationId = publish.body.data._id;
    const afterPublish = await request(app).get(`/api/v1/projects/${projectId}`).set('Authorization', `Bearer ${editor.token}`).query({ organizationId: orgId });
    expect(afterPublish.body.data.status).toBe('PUBLISHED');

    // --- metrics ---
    const metric = await request(app)
      .post(`/api/v1/projects/${projectId}/metrics`)
      .set('Authorization', `Bearer ${publisher.token}`)
      .send({ publicationId, metric: 'views', value: 1250, unit: 'count' });
    expect(metric.statusCode).toBe(201);

    // --- activity history accumulated ---
    const activity = await request(app).get(`/api/v1/projects/${projectId}/activity`).set('Authorization', `Bearer ${editor.token}`);
    expect(activity.statusCode).toBe(200);
    expect(activity.body.data.length).toBeGreaterThanOrEqual(10);

    // --- notifications: reviewer got draft notification; publisher got approval ---
    const reviewerNotifs = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${reviewer.token}`);
    expect(reviewerNotifs.statusCode).toBe(200);
    expect(reviewerNotifs.body.data.some((n) => n.type === 'draft_uploaded')).toBe(true);

    const publisherNotifs = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${publisher.token}`);
    expect(publisherNotifs.body.data.some((n) => n.type === 'approved')).toBe(true);

    // --- unauthorized user cannot see project ---
    const outsider = await registerAndLogin('Outsider', 'wf-outsider@example.com');
    const outsideView = await request(app).get(`/api/v1/projects/${projectId}`).set('Authorization', `Bearer ${outsider.token}`).query({ organizationId: orgId });
    expect(outsideView.statusCode).toBe(403);
  });
});
