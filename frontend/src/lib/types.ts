/**
 * Shared domain types for yv..
 *
 * These used to live in mockData.ts; they now stand alone so no page ever
 * needs to import from a file containing fake data. All runtime data comes
 * exclusively from the backend API (see ./data.ts).
 */

export type RoleName = 'admin' | 'editor' | 'reviewer' | 'designer' | 'publisher' | 'member'

export interface TeamMember {
  id: string
  name: string
  initials: string
  email: string
  role: RoleName
  title: string
  lastActive: string
}

/** PRD lifecycle statuses - see statusLabel() helpers where rendered. */
export interface Project {
  id: string
  title: string
  type: 'New Concept' | 'Experiment' | 'Revision' | 'Content Production'
  status: string
  description: string
  assignee: string // team member id
  creator: string
  reviewers: string[]
  updated: string
  scheduleDate?: string
  platform?: string
  postUrl?: string
  publishedAt?: string
  approvedVersion?: string
}
