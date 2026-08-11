/**
 * Frontend session simulation for Folio.
 * Mirrors the auth flows the backend will provide (login, logout, session
 * restore, protected routes) so the demo behaves like the real product.
 * Backend auth remains the real security boundary.
 */
import { useEffect, useState } from 'react'
import { team, type TeamMember } from './mockData'
import { switchViewer } from './viewer'

export interface Session {
  user: TeamMember
  loggedInAt: string
}

const SESSION_KEY = 'folio.session'

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    const member = team.find((m) => m.id === parsed.user?.id)
    if (!member) return null
    return { user: member, loggedInAt: parsed.loggedInAt ?? new Date().toISOString() }
  } catch {
    return null
  }
}

let current: Session | null = readSession()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

/** Sign in as a team member (demo auth — backend integration later). */
export function loginAs(id: string): Session | null {
  const member = team.find((m) => m.id === id)
  if (!member) return null
  current = { user: member, loggedInAt: new Date().toISOString() }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(current))
  } catch {
    /* storage unavailable — in-memory only */
  }
  switchViewer(member.id) // keep the demo viewer in sync with the session
  emit()
  return current
}

/** Sign out — clears the session and returns to the login screen. */
export function logout() {
  current = null
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* noop */
  }
  emit()
}

export function isAuthenticated(): boolean {
  return current !== null
}

export function getSession(): Session | null {
  return current
}

/** Subscribes a component to auth state. */
export function useAuth() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((x) => x + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return { session: current, authenticated: current !== null }
}