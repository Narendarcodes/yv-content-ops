/**
 * Domain formatting helpers. Status labels use the team's language
 * (PRD lifecycle), not developer/method names.
 */

export const STATUS_LABELS: Record<string, string> = {
  IDEA: 'Idea',
  APPROVED_CONCEPT: 'Concept approved',
  ASSIGNED: 'Assigned',
  WAITING_FOR_INPUTS: 'Waiting for inputs',
  INPUTS_READY: 'Inputs ready',
  IN_PROGRESS: 'In production',
  FIRST_DRAFT_SUBMITTED: 'Draft submitted',
  UNDER_REVIEW: 'In review',
  REVISION_REQUESTED: 'Revision requested',
  REVISION_IN_PROGRESS: 'Revision in progress',
  REVISION_SUBMITTED: 'Revision submitted',
  APPROVED: 'Approved',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ').toLowerCase()
}

/** 8.2 -> 0:08, 61 -> 1:01 */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}
