/**
 * Backend-side normalization helpers that align Mongoose document shapes
 * with the frontend's expected TypeScript enum values.
 *
 * These run at the service/controller boundary so responses are consistent
 * regardless of how the data was stored.
 */

/**
 * Normalize the project `type` field to one of the frontend's known values.
 *
 * Backend default is 'content' (lowercase), but the frontend union type is
 * 'New Concept' | 'Experiment' | 'Revision' | 'Content Production'.
 * This keeps the contract aligned without bloating the DB.
 */
const TYPE_MAP = {
  content: 'Content Production',
  'new concept': 'New Concept',
  experiment: 'Experiment',
  revision: 'Revision',
};

const VALID_TYPES = new Set(Object.values(TYPE_MAP));

function normalizeProjectType(type) {
  if (!type) return 'Content Production';
  if (VALID_TYPES.has(type)) return type;
  const key = String(type).toLowerCase();
  return TYPE_MAP[key] || 'Content Production';
}

function normalizeProject(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  // Ensure the type is frontend-compatible
  obj.type = normalizeProjectType(obj.type);
  return obj;
}

module.exports = { normalizeProjectType, normalizeProject, TYPE_MAP };
