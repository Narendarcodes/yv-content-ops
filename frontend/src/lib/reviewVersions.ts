/**
 * Typed ESM wrapper around the shared CJS pickVersion
 * (src/utils/reviewVersions.js — also required directly by jest).
 *
 * Vite's CJS interop turns `module.exports` into the default export, so
 * we import the namespace and pull pickVersion off it. This keeps one
 * implementation (tested by jest) with a typed surface for the frontend.
 */
import * as reviewVersionsCjs from '../../../src/utils/reviewVersions'

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
  const fn = (reviewVersionsCjs as any).pickVersion ?? (reviewVersionsCjs as any).default?.pickVersion
  return fn(versions, versionId) as ReviewVersion | null
}
