/**
 * TDD for video playback auth.
 *
 * Bug: <video> elements cannot send an Authorization header; they rely on
 * the httpOnly accessToken cookie set at login — which expires after 15
 * minutes (the /auth/refresh endpoint does NOT re-set it). So the player
 * 401s while the rest of the app keeps working (authFetch auto-refreshes
 * the localStorage token).
 *
 * Contract under test: the version-file stream endpoint accepts the access
 * token as a `?token=` query parameter, enabling direct <video src> URLs.
 * This is the standard pattern for media elements.
 */
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Project = require('../src/models/project.model');
const ProjectVersion = require('../src/models/projectVersion.model');
const storage = require('../src/storage');

describe('Video stream auth via ?token= query param', () => {
  let token, projectId, versionId, fileId;

  beforeAll(async () => {
    await require('../src/db/mongo').connect();
    const Role = require('../src/models/role.model');
    await Role.create({ name: 'admin', permissions: ['*'] });

    const email = `streamtest${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/register').send({ name: 'StreamTest', email, password: 'P@ssw0rd' });
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'P@ssw0rd' });
    token = login.body.data.accessToken;

    const org = await request(app).post('/api/v1/organizations').set('Authorization', `Bearer ${token}`).send({ name: 'StreamOrg', slug: `streamorg${Date.now()}` });
    const orgId = org.body.data._id;

    const proj = await request(app).post('/api/v1/projects').set('Authorization', `Bearer ${token}`).send({ title: 'Stream Project', organizationId: orgId });
    projectId = proj.body.data._id;

    const ver = await request(app).post(`/api/v1/projects/${projectId}/versions`).set('Authorization', `Bearer ${token}`).send({ changeSummary: 'stream test' });
    versionId = ver.body.data._id;

    // save a real small file through the storage adapter
    const payload = Buffer.from('fake-mp4-data-for-range-test') // 28 bytes
    const { storageRef } = await storage.saveFile(payload, { filename: 'clip.mp4', mimeType: 'video/mp4' });
    const version = await ProjectVersion.findById(versionId);
    version.files.push({ filename: 'clip.mp4', mimeType: 'video/mp4', size: payload.length, storageRef, uploadedBy: null });
    await version.save();
    fileId = String(version.files[0]._id);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  test('RED: file stream accepts ?token= query param (video elements cannot send headers)', async () => {
    const res = await request(app).get(
      `/api/v1/projects/${projectId}/versions/${versionId}/files/${fileId}?token=${token}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('video/mp4');
  });

  test('Range request with ?token= returns 206 Partial Content (enables seeking)', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/versions/${versionId}/files/${fileId}?token=${token}`)
      .set('Range', 'bytes=0-9');
    expect(res.statusCode).toBe(206);
    expect(res.headers['content-range']).toBe(`bytes 0-9/28`); // payload.length
    expect(res.headers['accept-ranges']).toBe('bytes');
  });

  test('invalid ?token= is still rejected (no auth bypass)', async () => {
    const res = await request(app).get(
      `/api/v1/projects/${projectId}/versions/${versionId}/files/${fileId}?token=not-a-real-token`
    );
    expect(res.statusCode).toBe(401);
  });
});
