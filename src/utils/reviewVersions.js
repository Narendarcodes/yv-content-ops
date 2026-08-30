/**
 * Version lookup for the review workspace (CommonJS, jest-only).
 *
 * Contract: NEVER returns undefined. Returns null when there is nothing
 * to pick, so the page can branch to its "No draft uploaded yet" state.
 *
 * IMPORTANT: this file is required by tests/ via plain require and must
 * stay pure CommonJS. The frontend has its own typed ESM copy at
 * frontend/src/lib/reviewVersions.ts — it must NOT import this file
 * (Vite would serve it to the browser as ESM → "module is not defined").
 * Behavior parity between the two is enforced by
 * tests/review-versions-module.test.js.
 */
function pickVersion(versions, versionId) {
  if (!Array.isArray(versions) || versions.length === 0) return null
  return versions.find((v) => v.id === versionId) ?? versions[0]
}

module.exports = { pickVersion }
