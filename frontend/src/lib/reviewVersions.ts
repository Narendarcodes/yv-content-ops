/**
 * Typed ESM pickVersion for the review workspace (frontend copy).
 *
 * Contract (must stay in parity with src/utils/reviewVersions.js — the
 * jest-tested CommonJS twin; parity enforced by
 * tests/review-versions-module.test.js): NEVER returns undefined.
 * Returns null when there is nothing to pick, so the page can branch
 * to its "No draft uploaded yet" state instead of crashing on .id.
 *
 * NOTE: deliberately self-contained. Do NOT import the CJS twin here —
 * Vite serves this tree as ESM and the `module` global does not exist
 * in the browser (that import was the "module is not defined" crash).
 */
export interface ReviewVersion {
  id: string
  label: string
  url: string
  summary?: string
  uploadedAt?: string
  [key: string]: unknown
}

/** Never undefined: returns null when there is no version to pick. */
export function pickVersion(versions: ReviewVersion[], versionId: string): ReviewVersion | null {
  if (!Array.isArray(versions) || versions.length === 0) return null
  return versions.find((v) => v.id === versionId) ?? versions[0]
}
