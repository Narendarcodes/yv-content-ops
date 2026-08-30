/**
 * Viewer - the signed-in user's identity & role.
 *
 * This used to be a demo "role simulation" store with a localStorage-backed
 * switcher that let anyone act as any teammate. That is gone: the viewer now
 * derives strictly from the authenticated backend session (lib/auth.ts).
 * One login = one identity. Role-based UI (nav items, action buttons) keys
 * off session.user.role, and the backend remains the security boundary.
 */
import { useEffect, useState } from 'react'
import { useAuth } from './auth'
import type { RoleName } from './types'

export interface Viewer {
  id: string
  name: string
  email: string
  role: RoleName
  title?: string
  initials: string
  photoUrl?: string | null
  profileImage?: string | null
}

function toViewer(user: { id?: string; name?: string; email?: string; role?: string; title?: string; photoUrl?: string | null; profileImage?: string | null } | null | undefined): Viewer | null {
  if (!user?.id) return null
  const name = user.name ?? ''
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0] || '')
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  return {
    id: user.id,
    name,
    email: user.email ?? '',
    role: (user.role as RoleName) || 'member',
    title: user.title,
    initials,
    photoUrl: (user as any).photoUrl ?? (user as any).profileImage ?? null,
    profileImage: (user as any).profileImage ?? (user as any).photoUrl ?? null,
  }
}

/**
 * Subscribes a component to the current authenticated viewer. Always returns
 * a Viewer object so call-sites stay simple; when no session exists yet it
 * returns a neutral placeholder (pages using this render behind RequireAuth,
 * so a real session user is present in practice).
 */
export function useViewer(): Viewer {
  const { session } = useAuth()
  const [viewer, setViewer] = useState<Viewer>(() => toViewer(session?.user) ?? PLACEHOLDER)
  useEffect(() => {
    setViewer(toViewer(session?.user) ?? PLACEHOLDER)
  }, [session])
  return viewer
}

const PLACEHOLDER: Viewer = {
  id: '',
  name: 'Signed out',
  email: '',
  role: 'member',
  title: '',
  initials: '?',
}

export function getViewer(): Viewer | null {
  return null // intentionally unsupported outside React - use useViewer()
}

export type { Permission, RoleInfo } from './roles'
export { can, ROLES, roleOf, PERMISSION_LABELS } from './roles'
