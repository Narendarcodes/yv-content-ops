const inputService = require('../services/input.service');
const projectService = require('../services/project.service');

async function list(req, res, next) {
  try {
    const { id } = req.params;
    const { state, limit, skip } = req.query;
    const result = await inputService.listInputs({
      projectId: id,
      state,
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
    const { id } = req.params;
    const { title, description, owner, source } = req.body;
    const input = await inputService.createInput({
      projectId: id,
      title,
      description,
      owner,
      source,
      requestedBy: req.user._id,
    });
    res.status(201).json({ data: input });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id, inputId } = req.params;
    const { state, assetRef } = req.body;
    const input = await inputService.updateInputState({
      projectId: id,
      inputId,
      state,
      assetRef,
      actorId: req.user._id,
    });
    // auto transition WAITING_FOR_INPUTS -> INPUTS_READY when all inputs received
    await projectService.checkInputsReady(id);
    res.json({ data: input });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update };
