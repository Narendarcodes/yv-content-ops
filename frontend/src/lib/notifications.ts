/**
 * Notifications store - module-level state so the sidebar badge and the
 * Notifications page stay in sync when items are marked read.
 *
 * Priority: real backend API → demo mock data fallback.
 */
import { useEffect, useState } from 'react'
import { listNotifications as apiList, markRead as apiMarkRead, markAllRead as apiMarkAllRead } from '../services/api'

export interface AppNotification {
  id: string
  type: string
  title: string
  desc: string
  time: string
  unread: boolean
}

// Start empty - real notifications arrive from the backend on refresh.
// No mock fallback: an empty feed is the truth when nothing is pending.
let items: AppNotification[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function relativeTime(iso?: string | Date): string {
  if (!iso) return '-'
  const d = new Date(iso as string)
  if (isNaN(d.getTime())) return '-'
  const m = Math.round((Date.now() - d.getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.round(h / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}

/** Fetch notifications from the backend. A successful response (even empty) replaces the list. */
export async function refreshNotifications(): Promise<AppNotification[]> {
  try {
    const data = await apiList()
    items = (data ?? []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title || '',
      desc: n.body || n.desc || '',
      time: n.time || relativeTime(n.createdAt),
      unread: n.unread ?? !n.read,
    }))
  } catch {
    // Backend unreachable - keep whatever we already have
  }
  emit()
  return items
}

export function getNotifications(): AppNotification[] {
  return items
}

export function unreadCount(): number {
  return items.filter((n) => n.unread).length
}

export async function markRead(id: string) {
  try {
    await apiMarkRead(id)
  } catch {
    /* ignore */
  }
  items = items.map((n) => (n.id === id ? { ...n, unread: false } : n))
  emit()
}

export async function markAllRead() {
  try {
    await apiMarkAllRead()
  } catch {
    /* ignore */
  }
  items = items.map((n) => ({ ...n, unread: false }))
  emit()
}

/** Subscribes a component to the notifications list. */
export function useNotifications(): AppNotification[] {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((x) => x + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return items
}