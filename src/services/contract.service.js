const Contract = require('../models/contract.model');
const Project = require('../models/project.model');
const bus = require('../events/hub');

const CONTRACT_STATUSES = ['draft', 'sent', 'viewed', 'signed'];

async function assertOrg(organizationId) {
  const Organization = require('../models/organization.model');
  const org = await Organization.findById(organizationId);
  if (!org) throw { status: 404, code: 'organization_not_found', message: 'Organization not found' };
  return org;
}

async function assertProjectIfSet(projectId, organizationId) {
  if (!projectId) return;
  const p = await Project.findOne({ _id: projectId, organizationId });
  if (!p) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
}

async function listContracts({ organizationId, status, limit = 100, skip = 0 }) {
  await assertOrg(organizationId);
  const q = { organizationId };
  if (status) q.status = status;
  const [items, total] = await Promise.all([
    Contract.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Contract.countDocuments(q),
  ]);
  return { items, total, limit, skip };
}

async function createContract({ organizationId, projectId = null, title, terms = '', amount = 0, currency = 'USD', createdBy }) {
  await assertOrg(organizationId);
  await assertProjectIfSet(projectId, organizationId);
  const contract = new Contract({ organizationId, projectId, title, terms, amount, currency, createdBy });
  await contract.save();
  await bus.emitAsync('contract.created', { organizationId, projectId, contract, actorId: createdBy });
  return contract;
}

async function getContract({ organizationId, contractId }) {
  const contract = await Contract.findOne({ _id: contractId, organizationId });
  if (!contract) throw { status: 404, code: 'contract_not_found', message: 'Contract not found' };
  return contract;
}

async function updateContract({ organizationId, contractId, actorId, fields = {} }) {
  const contract = await getContract({ organizationId, contractId });
  if (contract.status !== 'draft') {
    throw { status: 400, code: 'contract_not_editable', message: 'Only draft contracts can be edited' };
  }
  const changes = {};
  for (const k of ['title', 'terms', 'amount', 'currency', 'projectId', 'sentTo']) {
    if (fields[k] !== undefined) changes[k] = fields[k];
  }
  if (changes.projectId !== undefined) await assertProjectIfSet(changes.projectId, organizationId);
  Object.assign(contract, changes);
  await contract.save();
  await bus.emitAsync('contract.updated', { organizationId, contractId, actorId });
  return contract;
}

async function sendContract({ organizationId, contractId, actorId }) {
  const contract = await getContract({ organizationId, contractId });
  contract.status = 'sent';
  contract.sentAt = new Date();
  if (!contract.sentTo) contract.sentTo = '';
  await contract.save();
  await bus.emitAsync('contract.sent', { organizationId, contractId: contract._id, contract, actorId });
  return contract;
}

async function markViewed({ organizationId, contractId, actorId }) {
  const contract = await getContract({ organizationId, contractId });
  if (contract.status === 'signed') return contract;
  contract.status = 'viewed';
  contract.viewedAt = new Date();
  await contract.save();
  await bus.emitAsync('contract.viewed', { organizationId, contractId: contract._id, contract, actorId });
  return contract;
}

async function signContract({ organizationId, contractId, actorId, signerName, signerEmail }) {
  const contract = await getContract({ organizationId, contractId });
  if (contract.status === 'signed') throw { status: 400, code: 'already_signed', message: 'Contract is already signed' };
  contract.status = 'signed';
  contract.signedAt = new Date();
  contract.signedBy = actorId;
  contract.signerName = signerName || '';
  contract.signerEmail = signerEmail || '';
  await contract.save();
  await bus.emitAsync('contract.signed', { organizationId, contractId: contract._id, contract, actorId });
  return contract;
}

module.exports = {
  CONTRACT_STATUSES,
  listContracts,
  createContract,
  getContract,
  updateContract,
  sendContract,
  markViewed,
  signContract,
};
