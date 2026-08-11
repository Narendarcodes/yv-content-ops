/**
 * Role & permission model for Folio.
 * Mirrors the backend permission seeds (src/seed/roles.js) so the demo UX
 * matches what the API will enforce. Frontend checks are a UX aid only —
 * the backend remains the real security boundary.
 */
import type { TeamMember } from './mockData'

export type Role = TeamMember['role']

export type Permission =
  | 'view'
  | 'create'
  | 'upload'
  | 'comment'
  | 'approve'
  | 'schedule'
  | 'publish'
  | 'metrics'
  | 'manage_members'
  | 'manage_concepts'
  | 'settings'

export const PERMISSION_LABELS: Record<Permission, string> = {
  view: 'View projects',
  create: 'Create projects & concepts',
  upload: 'Upload drafts & versions',
  comment: 'Comment & request revisions',
  approve: 'Approve projects',
  schedule: 'Schedule publishing',
  publish: 'Publish content',
  metrics: 'View analytics & metrics',
  manage_members: 'Manage team members',
  manage_concepts: 'Manage concepts',
  settings: 'Workspace settings',
}

export interface RoleInfo {
  role: Role
  label: string
  /** Name of the role's dashboard module. */
  desk: string
  blurb: string
  permissions: Permission[]
}

export const ROLES: RoleInfo[] = [
  {
    role: 'admin',
    label: 'Admin',
    desk: 'Team overview',
    blurb: 'Full access — manages the organization and every project.',
    permissions: [
      'view', 'create', 'upload', 'comment', 'approve', 'schedule',
      'publish', 'metrics', 'manage_members', 'manage_concepts', 'settings',
    ],
  },
  {
    role: 'editor',
    label: 'Editor',
    desk: 'Production desk',
    blurb: 'Creates and produces projects, uploads versions, requests review.',
    permissions: [
      'view', 'create', 'upload', 'comment', 'approve', 'schedule',
      'metrics', 'manage_concepts', 'settings',
    ],
  },
  {
    role: 'designer',
    label: 'Designer',
    desk: 'Design desk',
    blurb: 'Produces visuals and uploads design versions for review.',
    permissions: ['view', 'upload', 'comment', 'metrics', 'manage_concepts', 'settings'],
  },
  {
    role: 'reviewer',
    label: 'Reviewer',
    desk: 'Review desk',
    blurb: 'Reviews drafts, comments on timestamps, requests revisions and approves.',
    permissions: ['view', 'comment', 'approve', 'settings'],
  },
  {
    role: 'publisher',
    label: 'Publisher',
    desk: 'Publishing desk',
    blurb: 'Schedules and publishes approved projects and records metrics.',
    permissions: ['view', 'schedule', 'publish', 'metrics', 'settings'],
  },
  {
    role: 'member',
    label: 'Member',
    desk: 'Your workspace',
    blurb: 'Read-only access — views projects and comments.',
    permissions: ['view', 'comment'],
  },
]

export function roleOf(viewer: TeamMember): RoleInfo {
  return ROLES.find((r) => r.role === viewer.role) ?? ROLES[0]
}

/** Frontend-only capability check (mirrors backend permissions). */
export function can(viewer: TeamMember, permission: Permission): boolean {
  return roleOf(viewer).permissions.includes(permission)
}
