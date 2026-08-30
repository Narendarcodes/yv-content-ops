/**
 * Integration test for the file upload endpoint.
 * Verifies that the full chain works: creating a version, then uploading
 * a real file buffer to that version's files collection.
 */
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Role = require('../src/models/role.model');

describe('File upload endpoint', () => {
  let token, orgId, projectId;

  beforeAll(async () => {
    await require('../src/db/mongo').connect();
    await Role.create({ name: 'admin', permissions: ['*'] });

    // Register + login admin
    await request(app).post('/api/v1/auth/register').send({
      name: 'UploadAdmin',
      email: 'uploadadmin@example.com',
      password: 'P@ssw0rd',
    });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'uploadadmin@example.com',
      password: 'P@ssw0rd',
    });
    token = login.body.data.accessToken;

    // Create org
    const org = await request(app).post('/api/v1/organizations').set('Authorization', `Bearer ${token}`).send({
      name: 'UploadOrg',
      slug: 'uploadorg',
    });
    orgId = org.body.data._id;

    // Create project
    const proj = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${token}`).send({
      organizationId: orgId,
      title: 'Upload Test Project',
      description: 'Testing file uploads',
    });
    projectId = proj.body.data._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  test('create version then upload file via multipart form', async () => {
    // Step 1: Create a version
    const versionRes = await request(app)
      .post(`/api/v1/projects/${projectId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ metadata: { filename: 'draft.mp4' }, changeSummary: 'initial upload test' });
    expect(versionRes.statusCode).toBe(201);
    const versionId = versionRes.body.data._id;

    // Step 2: Upload a file to that version (multipart form)
    const fileContent = Buffer.from('fake-video-bytes-for-testing');
    const uploadRes = await request(app)
      .post(`/api/v1/projects/${projectId}/versions/${versionId}/files`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fileContent, 'draft.mp4');
    expect(uploadRes.statusCode).toBe(201);
    expect(uploadRes.body.data).toHaveProperty('_id');
    expect(uploadRes.body.data.files.length).toBe(1);
    expect(uploadRes.body.data.files[0]).toHaveProperty('filename', 'draft.mp4');
    expect(uploadRes.body.data.files[0]).toHaveProperty('storageRef');
  });

  test('streaming endpoint returns 200 for stored file', async () => {
    // Create version + upload
    const versionRes = await request(app)
      .post(`/api/v1/projects/${projectId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ changeSummary: 'stream test' });
    const versionId = versionRes.body.data._id;

    const fileContent = Buffer.from('streaming-test-content');
    const uploadRes = await request(app)
      .post(`/api/v1/projects/${projectId}/versions/${versionId}/files`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fileContent, 'stream-test.mp4');
    const fileId = uploadRes.body.data.files[0]._id;

    // Stream it back
    const streamRes = await request(app)
      .get(`/api/v1/projects/${projectId}/versions/${versionId}/files/${fileId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(streamRes.statusCode).toBe(200);
    expect(streamRes.headers['accept-ranges']).toBe('bytes');
    // The backend returns the file's stored mimeType (multer infers video/mp4 for .mp4)
    expect(streamRes.headers['content-type']).toBe('video/mp4');
    expect(streamRes.body.length).toBe(fileContent.length);
  });

  test('streaming endpoint supports Range requests (206)', async () => {
    // Create version + upload
    const versionRes = await request(app)
      .post(`/api/v1/projects/${projectId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ changeSummary: 'range test' });
    const versionId = versionRes.body.data._id;

    const fileContent = Buffer.from('0123456789abcdefghijklmnopqrstuvwxyz');
    const uploadRes = await request(app)
      .post(`/api/v1/projects/${projectId}/versions/${versionId}/files`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fileContent, 'range-test.bin');
    const fileId = uploadRes.body.data.files[0]._id;

    // Range request: bytes 0-9
    const rangeRes = await request(app)
      .get(`/api/v1/projects/${projectId}/versions/${versionId}/files/${fileId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Range', 'bytes=0-9');
    expect(rangeRes.statusCode).toBe(206);
    expect(rangeRes.headers['content-range']).toMatch(/bytes 0-9\/\d+/);
    expect(rangeRes.body.length).toBe(10);
  });
});
