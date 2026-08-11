/**
 * Notifications store — module-level state so the sidebar badge and the
 * Notifications page stay in sync when items are marked read.
 */
import { useEffect, useState } from 'react'
import { notifications as seed } from './mockData'

export interface AppNotification {
  id: string
  type: string
  title: string
  desc: string
  time: string
  unread: boolean
}

let items: AppNotification[] = seed.map((n) => ({ ...n }))
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function getNotifications(): AppNotification[] {
  return items
}

export function unreadCount(): number {
  return items.filter((n) => n.unread).length
}

export function markRead(id: string) {
  items = items.map((n) => (n.id === id ? { ...n, unread: false } : n))
  emit()
}

export function markAllRead() {
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