/**
 * Stress + security test for the Aaryajanani Content Ops API.
 *
 * Usage (API must be running first):
 *   node scripts/stress-test.js [baseUrl]
 *
 * What it does:
 *   Phase 1  Setup actors (admin/editor/reviewer/publisher/outsider), org, members.
 *   Phase 2  Load test every endpoint with N concurrent requests (latency + status).
 *   Phase 3  Full project lifecycle scenario (concept -> ... -> publish).
 *   Phase 4  Fluit feature lifecycle scenario (tasks, brief, review lock, chat, contract, invoice).
 *   Phase 5  Security checks (auth, authz, validation, object ids, 404s, headers).
 *   Phase 6  Summary report.
 *
 * Rate limiting is NOT part of this script (server must run with a high RATE_LIMIT_MAX).
 * A separate check covers security headers.
 */

'use strict';

/* eslint-disable no-console */ // CLI tool: console output is the point

const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');

const BASE = (process.argv[2] || 'http://127.0.0.1:3000').replace(/\/$/, '');
const PASSWORD = 'P@ssw0rd123';
const SECRET = 'dev_access_secret'; // matches config default; dev server only

// Shared keep-alive agent so the client can sustain high concurrency
// (Node's built-in fetch caps sockets and throws "fetch failed" under load).
const AGENT = new http.Agent({ keepAlive: true, maxSockets: 300, keepAliveMsecs: 1000 });

function doRequest(method, path, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + path);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(u, { method, headers, agent: AGENT }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

/* ---------------------------- tiny helpers ---------------------------- */

async function api(method, path, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await doRequest(method, path, { headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let data = null;
  try {
    const parsed = JSON.parse(res.body);
    // unwrap the { data: ... } success envelope; keep error objects as-is
    data = parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : parsed;
  } catch { data = raw ? res.body : null; }
  return { status: res.status, data, headers: res.headers };
}

function assert(cond, label, detail) {
  if (!cond) throw new Error(`ASSERT FAILED: ${label}${detail ? ` — ${detail}` : ''}`);
}

const results = []; // {section, name, status, detail}

function record(section, name, ok, detail = '') {
  results.push({ section, name, ok: !!ok, detail });
  const mark = ok ? '  ✅' : '  ❌';
  console.log(`${mark} [${section}] ${name}${detail ? ` — ${detail}` : ''}`);
}

/* ---------------------------- load tester ---------------------------- */

async function loadTest(section, name, method, url, { token, body, count = 30, concurrency = 12, expected = [200] }) {
  const times = [];
  const statusCounts = {};
  let failures = 0;
  const errorSamples = [];
  let idx = 0;

  const runOne = async () => {
    const i = idx++;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const payload = typeof body === 'function' ? body(i) : body;
    const t0 = performance.now();
    try {
      const res = await doRequest(method, url, { headers, body: payload !== undefined ? JSON.stringify(payload) : undefined });
      const dt = performance.now() - t0;
      times.push(dt);
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      if (!expected.includes(res.status)) failures += 1;
    } catch (e) {
      times.push(performance.now() - t0);
      failures += 1;
      if (errorSamples.length < 3) errorSamples.push(e.message);
    }
  };

  const workers = [];
  for (let w = 0; w < concurrency; w += 1) {
    workers.push((async () => { while (idx < count) await runOne(); })());
  }
  await Promise.all(workers);

  const sorted = times.slice().sort((a, b) => a - b);
  const pct = (p) => Math.round(sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))]);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / Math.max(times.length, 1));
  const totalMs = times.reduce((a, b) => a + b, 0) / Math.max(concurrency, 1);
  const rps = Math.round((count / Math.max(totalMs, 1)) * 1000);
  const ok = failures === 0;

  const statuses = Object.entries(statusCounts).map(([s, c]) => `${s}×${c}`).join(' ');
  record(section, name, ok, `n=${count} c=${concurrency} | ${statuses} | avg=${avg}ms p95=${pct(0.95)}ms p99=${pct(0.99)}ms max=${Math.round(sorted[sorted.length - 1])}ms ~${rps} rps${errorSamples.length ? ' | ERR: ' + errorSamples.join('; ') : ''}`);
  return { ok, statusCounts, p95: pct(0.95), avg, rps };
}

/* ------------------------------ phases ------------------------------ */

async function setup() {
  const uniq = Date.now().toString(36);
  const users = {};
  for (const role of ['admin', 'editor', 'reviewer', 'publisher', 'outsider']) {
    const email = `${role}-${uniq}@example.com`;
    await api('POST', '/api/v1/auth/register', { body: { name: role, email, password: PASSWORD } });
    const login = await api('POST', '/api/v1/auth/login', { body: { email, password: PASSWORD } });
    if (login.status !== 200 || !login.data?.user?._id) throw new Error(`login failed for ${role}: ${login.status} ${JSON.stringify(login.data)}`);
    users[role] = {
      email,
      token: login.data.accessToken,
      refresh: login.data.refreshToken,
      userId: login.data.user._id,
    };
  }
  const org = await api('POST', '/api/v1/organizations', { token: users.admin.token, body: { name: `Stress Org ${uniq}`, slug: `stress-${uniq}` } });
  if (org.status !== 201) throw new Error(`org create failed: ${org.status} ${JSON.stringify(org.data)}`);
  const orgId = org.data._id;

  for (const role of ['editor', 'reviewer', 'publisher']) {
    await api('POST', `/api/v1/organizations/${orgId}/members`, {
      token: users.admin.token,
      body: { email: users[role].email, role },
    });
  }
  return { users, orgId, uniq };
}

async function phaseLifecycle(ctx) {
  const { users, orgId } = ctx;
  const editor = users.editor.token;
  const reviewer = users.reviewer.token;
  const publisher = users.publisher.token;

  // --- project ---
  const created = await api('POST', '/api/v1/projects', { token: editor, body: { organizationId: orgId, title: 'Stress Video', type: 'production' } });
  assert(created.status === 201 && created.data.status === 'IDEA', 'create project', `got ${created.status}`);
  const pid = created.data._id;

  // assign -> ASSIGNED
  const assign = await api('POST', `/api/v1/projects/${pid}/assign`, { token: editor, body: { assigneeId: users.editor.userId } });
  assert(assign.status === 200 && assign.data.status === 'ASSIGNED', 'assign project', `got ${assign.status}/${assign.data.status}`);

  // transition -> WAITING_FOR_INPUTS
  const tw = await api('POST', `/api/v1/projects/${pid}/transition`, { token: editor, body: { status: 'WAITING_FOR_INPUTS' } });
  assert(tw.status === 200, 'transition WAITING_FOR_INPUTS', `got ${tw.status}`);

  // inputs -> receive both -> INPUTS_READY
  const in1 = await api('POST', `/api/v1/projects/${pid}/inputs`, { token: editor, body: { title: 'Voiceover', owner: users.editor.userId } });
  const in2 = await api('POST', `/api/v1/projects/${pid}/inputs`, { token: editor, body: { title: 'Footage' } });
  assert(in1.status === 201 && in2.status === 201, 'create inputs', `got ${in1.status}/${in2.status}`);
  const r1 = await api('PATCH', `/api/v1/projects/${pid}/inputs/${in1.data._id}`, { token: editor, body: { state: 'received' } });
  const r2 = await api('PATCH', `/api/v1/projects/${pid}/inputs/${in2.data._id}`, { token: editor, body: { state: 'received' } });
  assert(r1.status === 200 && r2.status === 200, 'receive inputs', `got ${r1.status}/${r2.status}`);

  // -> IN_PROGRESS
  const tp = await api('POST', `/api/v1/projects/${pid}/transition`, { token: editor, body: { status: 'IN_PROGRESS' } });
  assert(tp.status === 200, 'transition IN_PROGRESS', `got ${tp.status}`);

  // upload draft -> FIRST_DRAFT_SUBMITTED
  const draft = await api('POST', `/api/v1/projects/${pid}/versions`, { token: editor, body: { metadata: { filename: 'draft.mp4' }, changeSummary: 'first cut' } });
  assert(draft.status === 201, 'upload draft version', `got ${draft.status}`);
  const draftVid = draft.data._id;

  // comments (unresolved, for review lock later)
  const c1 = await api('POST', `/api/v1/projects/${pid}/comments`, { token: reviewer, body: { versionId: draftVid, body: 'Please tighten the intro' } });
  const c2 = await api('POST', `/api/v1/projects/${pid}/comments`, { token: reviewer, body: { versionId: draftVid, body: 'Can we make the logo bigger' } });
  assert(c1.status === 201 && c2.status === 201, 'post comments', `got ${c1.status}/${c2.status}`);

  // revision flow
  const rev = await api('POST', `/api/v1/projects/${pid}/revisions`, { token: reviewer, body: { sourceVersionId: draftVid, reason: 'Intro too long' } });
  assert(rev.status === 201, 'request revision', `got ${rev.status}`);
  const rid = rev.data._id;
  const revUp = await api('PATCH', `/api/v1/projects/${pid}/revisions/${rid}`, { token: editor, body: { status: 'in_progress' } });
  assert(revUp.status === 200, 'start revision', `got ${revUp.status}`);
  const revised = await api('POST', `/api/v1/projects/${pid}/versions`, { token: editor, body: { metadata: { filename: 'revised.mp4' }, changeSummary: 'tightened' } });
  assert(revised.status === 201, 'upload revised version', `got ${revised.status}`);
  const revVid = revised.data._id;

  // approve -> APPROVED
  const approve = await api('POST', `/api/v1/projects/${pid}/approve`, { token: reviewer, body: { versionId: revVid } });
  assert(approve.status === 200 && approve.data.status === 'APPROVED', 'approve version', `got ${approve.status}/${approve.data.status}`);

  // schedule -> SCHEDULED
  const schedule = await api('POST', `/api/v1/projects/${pid}/schedule`, { token: publisher, body: { scheduledAt: '2026-09-01T09:00:00.000Z' } });
  assert(schedule.status === 200 && schedule.data.status === 'SCHEDULED', 'schedule', `got ${schedule.status}`);

  // publish -> PUBLISHED
  const pub = await api('POST', `/api/v1/projects/${pid}/publications`, { token: publisher, body: { platform: 'YouTube', postUrl: 'https://youtube.com/watch?v=xyz', postId: 'xyz' } });
  assert(pub.status === 201, 'record publication', `got ${pub.status}`);
  const publicationId = pub.data._id;

  // metrics
  const metric = await api('POST', `/api/v1/projects/${pid}/metrics`, { token: publisher, body: { publicationId, metric: 'views', value: 2500, unit: 'count' } });
  assert(metric.status === 201, 'record metric', `got ${metric.status}`);

  record('Lifecycle', 'full project lifecycle concept→publish', true);
  ctx.projectId = pid;
  ctx.draftVersionId = draftVid;
  return ctx;
}

async function phaseFluit(ctx) {
  const { users, orgId, projectId: pid, draftVersionId } = ctx;
  const admin = users.admin.token;

  // tasks
  const task = await api('POST', `/api/v1/projects/${pid}/tasks`, { token: admin, body: { title: 'Export master', priority: 'high', assignee: users.editor.userId } });
  assert(task.status === 201, 'create task', `got ${task.status}`);
  const tid = task.data._id;
  const st = await api('POST', `/api/v1/projects/${pid}/tasks/${tid}/status`, { token: admin, body: { status: 'in_progress' } });
  const st2 = await api('POST', `/api/v1/projects/${pid}/tasks/${tid}/status`, { token: admin, body: { status: 'done' } });
  assert(st.status === 200 && st2.status === 200 && st2.data.completedAt, 'task status transitions', `got ${st.status}/${st2.status}`);
  const taskUp = await api('PATCH', `/api/v1/projects/${pid}/tasks/${tid}`, { token: admin, body: { priority: 'low' } });
  assert(taskUp.status === 200, 'update task', `got ${taskUp.status}`);

  // brief
  const brief = await api('PUT', `/api/v1/projects/${pid}/brief`, {
    token: admin,
    body: { goal: 'Launch promo', targetAudience: 'Gen Z', deliverables: ['Master', 'Vertical'], deadline: '2026-09-15' },
  });
  assert(brief.status === 200, 'upsert brief', `got ${brief.status}`);
  const briefGet = await api('GET', `/api/v1/projects/${pid}/brief`, { token: admin });
  assert(briefGet.status === 200 && briefGet.data.goal === 'Launch promo', 'get brief', `got ${briefGet.status}`);

  // review summarize + lock (comments from lifecycle phase are unresolved)
  const sum = await api('POST', `/api/v1/projects/${pid}/reviews/summarize`, { token: admin, body: { versionId: draftVersionId } });
  assert(sum.status === 200 && Array.isArray(sum.data.actionItems) && sum.data.actionItems.length > 0, 'summarize review', `got ${sum.status} items=${sum.data.actionItems?.length}`);
  const lock = await api('POST', `/api/v1/projects/${pid}/reviews/lock`, { token: admin, body: { versionId: draftVersionId } });
  assert(lock.status === 201 && lock.data.lockedCommentCount === 2 && lock.data.revision.source === 'review_lock', 'lock review', `got ${lock.status} locked=${lock.data.lockedCommentCount}`);
  const lockAgain = await api('POST', `/api/v1/projects/${pid}/reviews/lock`, { token: admin, body: { versionId: draftVersionId } });
  assert(lockAgain.status === 400 && lockAgain.data.error.code === 'no_feedback', 'lock again -> no_feedback', `got ${lockAgain.status}`);

  // chat
  const channel = await api('POST', `/api/v1/projects/${pid}/channels`, { token: admin, body: { name: 'general' } });
  assert(channel.status === 201, 'create channel', `got ${channel.status}`);
  const chId = channel.data._id;
  const msg = await api('POST', `/api/v1/projects/${pid}/channels/${chId}/messages`, { token: admin, body: { body: 'hello team' } });
  assert(msg.status === 201, 'post message', `got ${msg.status}`);
  const reply = await api('POST', `/api/v1/projects/${pid}/channels/${chId}/messages`, { token: admin, body: { body: 'thread reply', parentId: msg.data._id } });
  assert(reply.status === 201, 'thread reply', `got ${reply.status}`);
  const list = await api('GET', `/api/v1/projects/${pid}/channels/${chId}/messages`, { token: admin });
  const thread = await api('GET', `/api/v1/projects/${pid}/channels/${chId}/messages?parentId=${msg.data._id}`, { token: admin });
  assert(list.data.total === 1 && thread.data.total === 1, 'message list vs thread filter', `top=${list.data.total} thread=${thread.data.total}`);

  // contract
  const contract = await api('POST', `/api/v1/organizations/${orgId}/contracts`, { token: admin, body: { projectId: pid, title: 'Production agreement', amount: 5000, terms: 'Standard terms' } });
  assert(contract.status === 201 && contract.data.status === 'draft', 'create contract', `got ${contract.status}`);
  const coId = contract.data._id;
  const sent = await api('POST', `/api/v1/organizations/${orgId}/contracts/${coId}/send`, { token: admin });
  assert(sent.status === 200 && sent.data.status === 'sent', 'send contract', `got ${sent.status}/${sent.data.status}`);
  const viewed = await api('POST', `/api/v1/organizations/${orgId}/contracts/${coId}/view`, { token: admin });
  assert(viewed.status === 200 && viewed.data.status === 'viewed', 'view contract', `got ${viewed.status}`);
  const signed = await api('POST', `/api/v1/organizations/${orgId}/contracts/${coId}/sign`, { token: admin, body: { signerName: 'Client A', signerEmail: 'client@example.com' } });
  assert(signed.status === 200 && signed.data.status === 'signed' && signed.data.signerName === 'Client A', 'sign contract', `got ${signed.status}/${signed.data.status}`);
  const editSigned = await api('PATCH', `/api/v1/organizations/${orgId}/contracts/${coId}`, { token: admin, body: { title: 'Nope' } });
  assert(editSigned.status === 400 && editSigned.data.error.code === 'contract_not_editable', 'cannot edit signed', `got ${editSigned.status}`);

  // invoice
  const invoice = await api('POST', `/api/v1/organizations/${orgId}/invoices`, { token: admin, body: { projectId: pid, number: 'INV-9001', amount: 2500 } });
  assert(invoice.status === 201 && invoice.data.status === 'draft', 'create invoice', `got ${invoice.status}`);
  const ivId = invoice.data._id;
  const sentIv = await api('POST', `/api/v1/organizations/${orgId}/invoices/${ivId}/send`, { token: admin });
  assert(sentIv.status === 200 && sentIv.data.status === 'sent', 'send invoice', `got ${sentIv.status}`);
  const outstanding = await api('GET', `/api/v1/organizations/${orgId}/invoices/outstanding`, { token: admin });
  assert(outstanding.status === 200 && outstanding.data.totalOutstanding === 2500, 'outstanding query', `got ${outstanding.status} amt=${outstanding.data.totalOutstanding}`);
  const paid = await api('POST', `/api/v1/organizations/${orgId}/invoices/${ivId}/pay`, { token: admin, body: { paymentMethod: 'bank_transfer' } });
  assert(paid.status === 200 && paid.data.status === 'paid', 'pay invoice', `got ${paid.status}`);
  const outstandingAfter = await api('GET', `/api/v1/organizations/${orgId}/invoices/outstanding`, { token: admin });
  assert(outstandingAfter.data.totalOutstanding === 0, 'outstanding after pay', `got ${outstandingAfter.data.totalOutstanding}`);

  // void
  const inv2 = await api('POST', `/api/v1/organizations/${orgId}/invoices`, { token: admin, body: { number: 'INV-9002', amount: 100 } });
  await api('POST', `/api/v1/organizations/${orgId}/invoices/${inv2.data._id}/send`, { token: admin });
  const voided = await api('POST', `/api/v1/organizations/${orgId}/invoices/${inv2.data._id}/void`, { token: admin });
  assert(voided.status === 200 && voided.data.status === 'void', 'void invoice', `got ${voided.status}`);

  record('Fluit features', 'tasks/brief/review-lock/chat/contract/invoice lifecycle', true);
  ctx.taskId = tid;
  ctx.channelId = chId;
  ctx.contractId = coId;
  ctx.invoiceId = ivId;
  return ctx;
}

async function phaseSecurity(ctx) {
  const { users, orgId, projectId: pid, uniq } = ctx;
  const admin = users.admin.token;

  /* ---- auth failures ---- */
  const noToken = await api('GET', '/api/v1/projects');
  record('Security', 'no token -> 401', noToken.status === 401, `got ${noToken.status}`);

  const badToken = await api('GET', '/api/v1/projects', { token: 'not-a-jwt' });
  record('Security', 'malformed token -> 401', badToken.status === 401, `got ${badToken.status}`);

  const garbage = await api('GET', '/api/v1/projects', { token: 'a.b.c' });
  record('Security', 'garbage token -> 401', garbage.status === 401, `got ${garbage.status}`);

  const forged = jwt.sign({ sub: users.admin.userId, role: 'admin' }, 'wrong-secret-123', { expiresIn: '15m' });
  const forgedRes = await api('GET', '/api/v1/projects', { token: forged });
  record('Security', 'forged signature -> 401', forgedRes.status === 401, `got ${forgedRes.status}`);

  const expired = jwt.sign({ sub: users.admin.userId }, SECRET, { expiresIn: -60 });
  const expiredRes = await api('GET', '/api/v1/projects', { token: expired });
  record('Security', 'expired token -> 401', expiredRes.status === 401, `got ${expiredRes.status}`);

  const wrongPw = await api('POST', '/api/v1/auth/login', { body: { email: users.admin.email, password: 'WrongPass123' } });
  record('Security', 'wrong password -> 401', wrongPw.status === 401, `got ${wrongPw.status}`);

  const dup = await api('POST', '/api/v1/auth/register', { body: { name: 'dup', email: users.admin.email, password: PASSWORD } });
  record('Security', 'duplicate email -> 409', dup.status === 409, `got ${dup.status}`);

  /* ---- refresh token rotation ---- */
  const first = await api('POST', '/api/v1/auth/refresh', { body: { refreshToken: users.admin.refresh } });
  record('Security', 'refresh token rotates ok', first.status === 200 && first.data.accessToken, `got ${first.status}`);
  const reuse = await api('POST', '/api/v1/auth/refresh', { body: { refreshToken: users.admin.refresh } });
  record('Security', 'refresh token reuse -> 401 (rotation)', reuse.status === 401, `got ${reuse.status}`);

  /* ---- authorization ---- */
  // publisher has no task.create -> 403
  const noPerm = await api('POST', `/api/v1/projects/${pid}/tasks`, { token: users.publisher.token, body: { title: 'x' } });
  record('Security', 'publisher POST task -> 403 (missing task.create)', noPerm.status === 403, `got ${noPerm.status}`);

  // outsider (not a member) cannot view project -> 403
  const outsiderView = await api('GET', `/api/v1/projects/${pid}`, { token: users.outsider.token });
  record('Security', 'non-member project view -> 403', outsiderView.status === 403, `got ${outsiderView.status}`);

  // outsider cannot hit org contracts -> 403
  const outsiderContracts = await api('GET', `/api/v1/organizations/${orgId}/contracts`, { token: users.outsider.token });
  record('Security', 'non-member org contracts -> 403', outsiderContracts.status === 403, `got ${outsiderContracts.status}`);

  // editor (member, contract.manage) CAN see contracts -> 200
  const editorContracts = await api('GET', `/api/v1/organizations/${orgId}/contracts`, { token: users.editor.token });
  record('Security', 'member with contract.manage -> 200', editorContracts.status === 200, `got ${editorContracts.status}`);

  /* ---- validation ---- */
  const badEmail = await api('POST', '/api/v1/auth/register', { body: { name: 'x', email: 'not-an-email', password: PASSWORD } });
  record('Security', 'invalid email -> 400 validation_error', badEmail.status === 400 && badEmail.data.error.code === 'validation_error', `got ${badEmail.status}`);

  const shortPw = await api('POST', '/api/v1/auth/register', { body: { name: 'x', email: 'x@stress.test', password: 'short' } });
  record('Security', 'short password -> 400 validation_error', shortPw.status === 400, `got ${shortPw.status}`);

  const noTitle = await api('POST', '/api/v1/projects', { token: admin, body: { organizationId: orgId } });
  record('Security', 'project missing title -> 400 validation_error', noTitle.status === 400 && noTitle.data.error.details?.length > 0, `got ${noTitle.status}`);

  const noSlug = await api('POST', '/api/v1/organizations', { token: admin, body: { name: 'No Slug Org' } });
  record('Security', 'org missing slug -> 400 (not 500!)', noSlug.status === 400, `got ${noSlug.status} ${noSlug.data?.error?.message || ''}`);

  const badTaskStatus = await api('POST', `/api/v1/projects/${pid}/tasks`, { token: admin, body: { title: 'x', priority: 'urgent' } });
  record('Security', 'invalid task priority -> 400 validation_error', badTaskStatus.status === 400 && badTaskStatus.data.error.code === 'validation_error', `got ${badTaskStatus.status}`);

  const hugeBody = await api('POST', `/api/v1/projects/${pid}/comments`, { token: admin, body: { versionId: ctx.draftVersionId, body: 'x'.repeat(20000) } });
  record('Security', 'oversized comment -> 400 validation_error', hugeBody.status === 400, `got ${hugeBody.status}`);

  // unknown fields stripped (stripUnknown) -> should NOT 400
  const extraFields = await api('POST', '/api/v1/auth/register', { body: { name: 'y', email: `y-${uniq}@example.com`, password: PASSWORD, hacked: true, role: 'admin' } });
  record('Security', 'unknown fields stripped (mass-assignment guard)', extraFields.status === 201 && !extraFields.data.role, `got ${extraFields.status}`);

  /* ---- object id / not found ---- */
  const invalidId = await api('GET', '/api/v1/projects/not-an-objectid', { token: admin });
  record('Security', 'invalid ObjectId -> 400/404 (no 500!)', [400, 404].includes(invalidId.status), `got ${invalidId.status} ${invalidId.data?.error?.code || ''}`);

  const fakeId = await api('GET', '/api/v1/projects/507f1f77bcf86cd799439011', { token: admin });
  record('Security', 'nonexistent resource -> 403/404 (no 500)', [403, 404].includes(fakeId.status), `got ${fakeId.status} ${fakeId.data?.error?.code || ''}`);

  /* ---- security headers (helmet) ---- */
  const hdr = await api('GET', '/api/v1/health');
  const h = hdr.headers || {};
  const get = (k) => (typeof h.get === 'function' ? h.get(k) : h[k]);
  const checks = {
    'x-content-type-options: nosniff': get('x-content-type-options') === 'nosniff',
    'x-frame-options present': !!get('x-frame-options'),
    'content-security-policy present': !!get('content-security-policy'),
    'x-dns-prefetch-control: off': get('x-dns-prefetch-control') === 'off',
    'strict-transport-security present': !!get('strict-transport-security'),
    'x-powered-by absent (no fingerprint)': !get('x-powered-by'),
  };
  for (const [name, ok] of Object.entries(checks)) {
    record('Security', `header: ${name}`, ok, ok ? `value=${get(name.split(':')[0])}` : `value=${get(name.split(':')[0])}`);
  }

  /* ---- error envelope does not leak internals ---- */
  const env = await api('GET', '/api/v1/projects/not-an-objectid');
  const bodyStr = JSON.stringify(env.data);
  record('Security', 'error body is structured envelope', env.data && env.data.error && env.data.error.code, bodyStr.slice(0, 120));
}

async function phaseStress(ctx) {
  const { users, orgId, projectId: pid, uniq } = ctx;
  const admin = users.admin.token;

  /* GET / health / docs under load */
  await loadTest('Load', 'GET /health', 'GET', '/api/v1/health', { count: 200, concurrency: 50, expected: [200] });
  await loadTest('Load', 'GET /docs (OpenAPI yaml)', 'GET', '/api/v1/docs', { count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /docs/ui (Swagger)', 'GET', '/api/v1/docs/ui', { count: 60, concurrency: 20, expected: [200] });

  /* auth */
  await loadTest('Load', 'POST /auth/login', 'POST', '/api/v1/auth/login', {
    count: 100, concurrency: 30, expected: [200],
    body: () => ({ email: users.admin.email, password: PASSWORD }),
  });
  await loadTest('Load', 'GET /auth/me', 'GET', '/api/v1/auth/me', { token: admin, count: 100, concurrency: 30, expected: [200] });

  /* projects */
  await loadTest('Load', 'GET /projects?organizationId=', 'GET', `/api/v1/projects?organizationId=${orgId}`, { token: admin, count: 80, concurrency: 25, expected: [200] });
  await loadTest('Load', 'GET /projects/:id', 'GET', `/api/v1/projects/${pid}`, { token: admin, count: 80, concurrency: 25, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/versions', 'GET', `/api/v1/projects/${pid}/versions`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/inputs', 'GET', `/api/v1/projects/${pid}/inputs`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/comments', 'GET', `/api/v1/projects/${pid}/comments`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/revisions', 'GET', `/api/v1/projects/${pid}/revisions`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/publications', 'GET', `/api/v1/projects/${pid}/publications`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/metrics', 'GET', `/api/v1/projects/${pid}/metrics`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/activity', 'GET', `/api/v1/projects/${pid}/activity`, { token: admin, count: 60, concurrency: 20, expected: [200] });

  /* tasks */
  await loadTest('Load', 'GET /projects/:id/tasks', 'GET', `/api/v1/projects/${pid}/tasks`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/tasks/:taskId', 'GET', `/api/v1/projects/${pid}/tasks/${ctx.taskId}`, { token: admin, count: 60, concurrency: 20, expected: [200] });

  /* brief / reviews / chat */
  await loadTest('Load', 'GET /projects/:id/brief', 'GET', `/api/v1/projects/${pid}/brief`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /projects/:id/channels', 'GET', `/api/v1/projects/${pid}/channels`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET channels/:id/messages', 'GET', `/api/v1/projects/${pid}/channels/${ctx.channelId}/messages`, { token: admin, count: 60, concurrency: 20, expected: [200] });

  /* org / members / contracts / invoices */
  await loadTest('Load', 'GET /organizations/:id/members', 'GET', `/api/v1/organizations/${orgId}/members`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /organizations/:id/contracts', 'GET', `/api/v1/organizations/${orgId}/contracts`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /organizations/:id/contracts/:id', 'GET', `/api/v1/organizations/${orgId}/contracts/${ctx.contractId}`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /organizations/:id/invoices', 'GET', `/api/v1/organizations/${orgId}/invoices`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /organizations/:id/invoices/outstanding', 'GET', `/api/v1/organizations/${orgId}/invoices/outstanding`, { token: admin, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /organizations/:id/invoices/:id', 'GET', `/api/v1/organizations/${orgId}/invoices/${ctx.invoiceId}`, { token: admin, count: 60, concurrency: 20, expected: [200] });

  /* notifications */
  await loadTest('Load', 'GET /notifications', 'GET', '/api/v1/notifications', { token: users.editor.token, count: 60, concurrency: 20, expected: [200] });
  await loadTest('Load', 'GET /notifications/unread-count', 'GET', '/api/v1/notifications/unread-count', { token: users.editor.token, count: 60, concurrency: 20, expected: [200] });

  /* write endpoints under concurrency (independent creates) */
  await loadTest('Load', 'POST /projects (concurrent creates)', 'POST', '/api/v1/projects', {
    token: admin, count: 25, concurrency: 10, expected: [201],
    body: (i) => ({ organizationId: orgId, title: `Load Project ${i}` }),
  });
  await loadTest('Load', 'POST /organizations (concurrent creates)', 'POST', '/api/v1/organizations', {
    token: admin, count: 20, concurrency: 8, expected: [201],
    body: (i) => ({ name: `Load Org ${uniq}-${i}`, slug: `load-org-${uniq}-${i}` }),
  });
  await loadTest('Load', 'POST /projects/:id/tasks (concurrent)', 'POST', `/api/v1/projects/${pid}/tasks`, {
    token: admin, count: 30, concurrency: 10, expected: [201],
    body: (i) => ({ title: `Task ${i}` }),
  });
  await loadTest('Load', 'POST /projects/:id/channels (concurrent)', 'POST', `/api/v1/projects/${pid}/channels`, {
    token: admin, count: 25, concurrency: 10, expected: [201],
    body: (i) => ({ name: `chan-${i}` }),
  });
  await loadTest('Load', 'POST /organizations/:id/contracts (concurrent)', 'POST', `/api/v1/organizations/${orgId}/contracts`, {
    token: admin, count: 20, concurrency: 8, expected: [201],
    body: (i) => ({ title: `Contract ${i}`, amount: 100 + i }),
  });
  await loadTest('Load', 'POST /organizations/:id/invoices (concurrent)', 'POST', `/api/v1/organizations/${orgId}/invoices`, {
    token: admin, count: 20, concurrency: 8, expected: [201],
    body: (i) => ({ number: `INV-L${i}`, amount: 50 + i }),
  });
}

/* ------------------------------ report ------------------------------ */

function report() {
  const failed = results.filter((r) => !r.ok);
  const bySection = {};
  for (const r of results) bySection[r.section] = (bySection[r.section] || 0) + (r.ok ? 1 : 0);
  console.log('\n' + '='.repeat(70));
  console.log('STRESS + SECURITY REPORT');
  console.log('='.repeat(70));
  for (const [section, ok] of Object.entries(bySection)) {
    const sec = results.filter((r) => r.section === section);
    console.log(`${section.padEnd(14)} ${ok}/${sec.length} passed`);
  }
  console.log('-' .repeat(70));
  console.log(`TOTAL: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFAILED CHECKS:');
    for (const f of failed) console.log(`  ❌ [${f.section}] ${f.name} — ${f.detail}`);
    process.exitCode = 1;
  } else {
    console.log('\nAll checks passed 🎉');
  }
}

/* ------------------------------- main ------------------------------- */

(async () => {
  const t0 = performance.now();
  console.log(`Stress-testing ${BASE}\n`);
  const ctx = await setup();
  record('Setup', `registered 5 users + org (orgId=${ctx.orgId})`, true);
  await phaseLifecycle(ctx);
  await phaseFluit(ctx);
  await phaseStress(ctx);
  await phaseSecurity(ctx);
  const seconds = ((performance.now() - t0) / 1000).toFixed(1);
  console.log(`\nCompleted in ${seconds}s`);
  report();
})().catch((err) => {
  console.error('\nFATAL:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
});
