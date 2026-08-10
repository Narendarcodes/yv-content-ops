const contractService = require('../services/contract.service');

async function list(req, res, next) {
  try {
    const { organizationId } = req.params;
    const { status, limit, skip } = req.query;
    const result = await contractService.listContracts({
      organizationId,
      status,
      limit: parseInt(limit, 10) || 100,
      skip: parseInt(skip, 10) || 0,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { organizationId } = req.params;
    const { projectId, title, terms, amount, currency } = req.body;
    const contract = await contractService.createContract({
      organizationId,
      projectId: projectId || null,
      title,
      terms,
      amount,
      currency,
      createdBy: req.user._id,
    });
    res.status(201).json({ data: contract });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const { organizationId, contractId } = req.params;
    const contract = await contractService.getContract({ organizationId, contractId });
    res.json({ data: contract });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { organizationId, contractId } = req.params;
    const contract = await contractService.updateContract({
      organizationId,
      contractId,
      actorId: req.user._id,
      fields: req.body,
    });
    res.json({ data: contract });
  } catch (err) {
    next(err);
  }
}

async function send(req, res, next) {
  try {
    const { organizationId, contractId } = req.params;
    const contract = await contractService.sendContract({ organizationId, contractId, actorId: req.user._id });
    res.json({ data: contract });
  } catch (err) {
    next(err);
  }
}

async function markViewed(req, res, next) {
  try {
    const { organizationId, contractId } = req.params;
    const contract = await contractService.markViewed({ organizationId, contractId, actorId: req.user._id });
    res.json({ data: contract });
  } catch (err) {
    next(err);
  }
}

async function sign(req, res, next) {
  try {
    const { organizationId, contractId } = req.params;
    const { signerName, signerEmail } = req.body;
    const contract = await contractService.signContract({
      organizationId,
      contractId,
      actorId: req.user._id,
      signerName,
      signerEmail,
    });
    res.json({ data: contract });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, get, update, send, markViewed, sign };
