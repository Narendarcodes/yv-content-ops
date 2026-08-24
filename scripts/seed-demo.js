// Seed demo organization + users so the frontend "sign in as" demo buttons
// work against the live backend. Idempotent (upserts), safe to re-run.
//
// Demo password for every account is "demo" (bcrypt-hashed exactly like the
// backend's auth.service.register). The frontend demo buttons POST
// { email, password: 'demo' } to /auth/login, so these accounts match.
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/user.model');
const Organization = require('../src/models/organization.model');
const Membership = require('../src/models/membership.model');
const Role = require('../src/models/role.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cop';
const DEMO_PASSWORD = 'demo';

const ORG = { name: 'Aaryajanani Content Team', slug: 'aaryajanani' };

const MEMBERS = [
  { email: 'ananya@aaryajanani.org', name: 'Ananya Rao', role: 'admin' },
  { email: 'priya@aaryajanani.org', name: 'Priya Menon', role: 'editor' },
  { email: 'arjun@aaryajanani.org', name: 'Arjun Nair', role: 'editor' },
  { email: 'sana@aaryajanani.org', name: 'Sana Kapoor', role: 'reviewer' },
  { email: 'rohan@aaryajanani.org', name: 'Rohan Das', role: 'designer' },
  { email: 'meera@aaryajanani.org', name: 'Meera Iyer', role: 'publisher' },
];

const ROLES = [
  { name: 'admin', permissions: ['*'], description: 'Full access within the organization' },
  {
    name: 'editor',
    permissions: [
      'project.create', 'project.transition', 'project.assign', 'project.upload_version',
      'project.comment', 'project.revision', 'project.view', 'task.create', 'task.update',
      'brief.manage', 'chat.post', 'contract.manage', 'invoice.manage',
    ],
    description: 'Creates and works on projects',
  },
  {
    name: 'reviewer',
    permissions: ['project.view', 'project.comment', 'project.revision', 'project.approve', 'task.create', 'task.update', 'chat.post'],
    description: 'Reviews drafts, comments, requests revisions, approves',
  },
  {
    name: 'publisher',
    permissions: ['project.view', 'project.schedule', 'project.publish', 'project.metrics'],
    description: 'Schedules and publishes approved projects, records metrics',
  },
  {
    name: 'designer',
    permissions: ['project.view', 'project.comment', 'chat.post'],
    description: 'Designs assets and comments',
  },
];

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to', MONGO_URI);

  for (const r of ROLES) {
    await Role.findOneAndUpdate({ name: r.name }, { $set: r }, { upsert: true, new: true });
  }
  console.log('Roles seeded');

  const org = await Organization.findOneAndUpdate(
    { slug: ORG.slug },
    { $set: ORG },
    { upsert: true, new: true }
  );
  console.log('Org:', org._id.toString());

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, salt);

  for (const m of MEMBERS) {
    const user = await User.findOneAndUpdate(
      { email: m.email },
      { $set: { name: m.name, passwordHash } },
      { upsert: true, new: true }
    );
    await Membership.findOneAndUpdate(
      { userId: user._id, organizationId: org._id },
      { $set: { role: m.role, disabled: false } },
      { upsert: true, new: true }
    );
    console.log('Seeded', m.email, '->', m.role);
  }

  console.log('Demo seed complete.');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
