/**
 * Demo role simulation for the Folio frontend.
 * Lets us walk every role's userflow (admin, editor, reviewer, designer,
 * publisher, member) before backend integration. Backend auth remains the
 * real security boundary — this is a UX verification aid only.
 */
import { useEffect, useState } from 'react'
import { team, type TeamMember } from './mockData'

export type { Permission, RoleInfo } from './roles'
export { can, ROLES, roleOf, PERMISSION_LABELS } from './roles'

const STORAGE_KEY = 'folio.demo-viewer'

function initialUser(): TeamMember {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  return team.find((m) => m.id === saved) ?? team[0]
}

const state: { user: TeamMember } = { user: initialUser() }

const listeners = new Set<() => void>()

export function switchViewer(id: string) {
  const next = team.find((m) => m.id === id)
  if (!next) return
  state.user = next
  try {
    localStorage.setItem(STORAGE_KEY, next.id)
  } catch {
    /* storage unavailable — demo still works in-memory */
  }
  listeners.forEach((l) => l())
}

export function getViewer(): TeamMember {
  return state.user
}

/** Subscribes a component to the current viewer. */
export function useViewer(): TeamMember {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((x) => x + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return state.user
}
