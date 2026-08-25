/**
 * Frontend session management for yv..
 *
 * Priority:
 *   1. Real backend (access token from cookies / Authorization header)
 *   2. Fallback to demo mock data stored in localStorage so the UI never
 *      breaks during the backend rollout.
 *
 * The `useAuth()` hook returns `{ session, authenticated }` where `session.user`
 * is a `SessionUser` shape. Components that need the legacy `TeamMember` shape
 * can call `session.user` and map the fields they use.
 */
import { useEffect, useState } from 'react'

import { login as apiLogin, logout as apiLogout, getMe } from '../services/api'
import { clearDataCaches } from './data'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  title?: string
}

/** Legacy TeamMember shape - kept for components that still import it. */
export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  title?: string
  initials: string
}

/** Mapped from SessionUser → TeamMember (used by the fallback path). */
function mapUserToTeamMember(user: SessionUser): TeamMember {
  const initials = user.name.split(' ').reduce((a, b) => a + b[0], '')
  return { id: user.id, name: user.name, email: user.email, role: user.role, title: user.title, initials }
}

/** Backend session persisted in localStorage (mirrors the httpOnly cookie). */
export interface BackendSession {
  user: SessionUser
  accessToken?: string
  refreshToken?: string
  loggedInAt: string
}

/** Read the session from the persisted store. */
function readPersistedSession(): BackendSession | null {
  try {
    const raw = localStorage.getItem('yv.session')
    if (!raw) return null
    const parsed = JSON.parse(raw) as BackendSession & { user?: SessionUser & { _id?: string } }
    const uid = parsed.user?.id ?? parsed.user?._id
    if (parsed.user && uid) return parsed as BackendSession
    return null
  } catch {
    return null
  }
}

/** Write the session to localStorage (kept in sync with the backend cookie). */
function writePersistedSession(session: BackendSession): void {
  try {
    localStorage.setItem('yv.session', JSON.stringify(session))
  } catch {
    /* storage unavailable - in-memory only */
  }
}

/** ------------------------------------------------------------------- */
/** Log in using the real backend. Returns the session or null. */
async function loginBackend(email: string, password: string): Promise<BackendSession | null> {
  try {
    const data = await apiLogin(email, password)
    // data = { user: SessionUser, accessToken: string }
    const session: BackendSession = {
      user: data.user,
      accessToken: data.accessToken,
      // Persist the refresh token too - without it the silent-refresh path
      // cannot renew the 15-minute access token and requests start failing
      // with 'Invalid token' until the user logs in again.
      refreshToken: data.refreshToken,
      loggedInAt: new Date().toISOString(),
    }
    writePersistedSession(session)
    return session
  } catch {
    return null
  }
}

/** ------------------------------------------------------------------- */
/** Sign out - revokes the token on the backend and clears localStorage. */
async function logoutBackend(): Promise<void> {
  try {
    const session = readPersistedSession()
    if (session?.accessToken) {
      await apiLogout(session.accessToken)
    }
  } catch {
    /* ignore logout errors */
  }
  // Remove the persisted session so the frontend knows it's signed out
  try {
    localStorage.removeItem('yv.session')
  } catch {
    /* noop */
  }
  clearDataCaches()
}

/** ------------------------------------------------------------------- */
/** Core auth hook - priority: backend session → demo fallback. */
export function useAuth() {
  // Initialize from the persisted session once (lazy initializer) so we never
  // call setState during render - that would cause an infinite re-render loop.
  const [session, setSession] = useState<BackendSession | null>(() => readPersistedSession())
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    const s = readPersistedSession() as (BackendSession & { user?: SessionUser & { _id?: string } }) | null
    return !!(s?.user?.id ?? s?.user?._id)
  })

  // 2️⃣ If no persisted session, try the backend me endpoint
  useEffect(() => {
    if (authenticated) return // already have a session

    async function boot() {
      try {
        const data = await getMe()
        const user = { ...data, id: (data as SessionUser & { _id?: string }).id ?? (data as SessionUser & { _id?: string })._id }
        const session: BackendSession = {
          user,
          loggedInAt: new Date().toISOString(),
        }
        setSession(session)
        setAuthenticated(true)
        writePersistedSession(session)
      } catch {
        // backend not available - fall through; session stays unauthenticated
      }
    }

    boot()
  }, [authenticated])

  // 3️⃣ Listen for storage events (e.g. another tab signing out)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'yv.session') {
        const s = readPersistedSession()
        setSession(s)
        setAuthenticated(!!s?.user?.id)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [session])

  return { session, authenticated }
}

/** ------------------------------------------------------------------- */
/** Log in with email+password - tries backend first. */
export async function login(email: string, password: string): Promise<BackendSession | null> {
  return await loginBackend(email, password)
}

/** ------------------------------------------------------------------- */
/** Update the persisted session's user fields (e.g. after a profile edit). */
export function updateSessionUser(patch: Partial<SessionUser>): void {
  const session = readPersistedSession()
  if (!session) return
  const next = { ...session, user: { ...session.user, ...patch } }
  writePersistedSession(next)
  // Notify every hook (same-tab storage writes don't fire native events).
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: 'yv.session' }))
  } catch {
    /* noop */
  }
}

/** ------------------------------------------------------------------- */
/** Sign out - backend first, then cleanup. */
export async function logout(): Promise<void> {
  await logoutBackend()
}

/** ------------------------------------------------------------------- */
/** Check authentication status. */
export function isAuthenticated(): boolean {
  const s = readPersistedSession()
  return !!(s?.user?.id)
}

/** ------------------------------------------------------------------- */
/** Get the current session. */
export function getSession(): BackendSession | null {
  return readPersistedSession()
}

/** ------------------------------------------------------------------- */
/** Map backend session user to the legacy TeamMember shape. */
export function mapUser(user: SessionUser): TeamMember {
  return mapUserToTeamMember(user)
}

/** ------------------------------------------------------------------- */
/** Subscribe to auth state changes. */
export function useAuthState() {
  const { session, authenticated } = useAuth()
  return { session, authenticated }
}