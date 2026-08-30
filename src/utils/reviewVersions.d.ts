/**
 * Types for reviewVersions.js — sibling declaration so TypeScript resolves
 * `import ... from '.../reviewVersions'` to these shapes while jest requires
 * the CommonJS implementation directly.
 */

export interface ReviewVersion {
  id: string
  label: string
  url: string
  summary?: string
  uploadedAt?: string
  [key: string]: unknown
}

export function pickVersion(versions: ReviewVersion[], versionId: string): ReviewVersion | null
