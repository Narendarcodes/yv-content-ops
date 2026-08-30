/**
 * Version lookup for the review workspace.
 * Extracted from ReviewWorkspacePage so the empty-versions crash
 * (reading 'id' of undefined) is testable in isolation.
 *
 * Contract: NEVER returns undefined. Returns null when there is nothing
 * to pick, so the page can branch to its "No draft uploaded yet" state
 * instead of dereferencing version.id and crashing.
 *
 * CommonJS only — jest requires it directly. The frontend imports it
 * through frontend/src/lib/reviewVersions.ts (typed ESM wrapper); Vite's
 * CJS interop picks up module.exports automatically.
 */
function pickVersion(versions, versionId) {
  if (!Array.isArray(versions) || versions.length === 0) return null
  return versions.find((v) => v.id === versionId) ?? versions[0]
}

module.exports = { pickVersion }
