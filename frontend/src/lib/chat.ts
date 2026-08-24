/**
 * Live team chat state for Folio.
 *
 * - Loads the "Team Chat" project's channels + messages from the API.
 * - Opens one Socket.IO connection, authenticated with the session JWT.
 * - Joins a room per open channel; incoming `message:new` events are merged
 *   into state in real time (no refresh needed).
 * - Exposes send() which persists via REST; the socket broadcast delivers it
 *   to everyone else viewing the channel.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import * as api from '../services/api'
import { getSession } from './auth'

const TEAM_CHAT_TITLE = 'Team Chat'

export interface ChatChannel {
  id: string
  name: string
  projectId: string
}

export interface ChatMessage {
  id: string
  author: string
  text: string
  time: string
  pending?: boolean
  failed?: boolean
}

function fmtTime(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date()
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

let socket: Socket | null = null

function getSocket(): Socket {
  if (socket) return socket
  const token = getSession()?.accessToken ?? ''
  socket = io('http://localhost:3000', { auth: { token }, transports: ['websocket', 'polling'] })
  return socket
}

/** Close the shared socket (e.g. on logout). */
export function closeChatSocket() {
  socket?.disconnect()
  socket = null
}

export function useChat() {
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessage[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const joinedRef = useRef<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const orgs = await api.listOrgs()
      if (!orgs?.length) throw new Error('no org')
      const projects = await api.listProjects(orgs[0].id)
      const chatProject = projects.find((p: any) => p.title === TEAM_CHAT_TITLE)
      if (!chatProject) throw new Error('no chat project')
      const chans = await api.listProjectChannels(chatProject.id)
      const msgs: Record<string, ChatMessage[]> = {}
      for (const ch of chans) {
        const list = await api.listChannelMessages(chatProject.id, ch.id)
        msgs[String(ch.id)] = list.map((m: any) => ({
          id: String(m.id),
          author: String(m.author?._id ?? m.author),
          text: m.body,
          time: fmtTime(m.sentAt || m.createdAt),
        }))
      }
      setChannels(
        chans.map((c: any) => ({
          id: String(c.id),
          name: '#' + c.name,
          projectId: String(c.projectId ?? chatProject.id),
        })),
      )
      setMessagesByChannel(msgs)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Real-time: join rooms for known channels and merge incoming messages.
  useEffect(() => {
    if (!channels.length) return
    const sock = getSocket()
    const onNew = (payload: { channelId: string; message: any }) => {
      const cid = String(payload.channelId)
      setMessagesByChannel((prev) => {
        const list = prev[cid] ?? []
        const msg = payload.message ?? {}
        const id = String(msg._id ?? msg.id ?? `${Date.now()}`)
        // Drop any optimistic copy with matching text by this author.
        const filtered = list.filter((m) => !(m.pending && m.text === msg.body))
        if (filtered.some((m) => m.id === id)) return prev
        return {
          ...prev,
          [cid]: [
            ...filtered,
            { id, author: String(msg.author?._id ?? msg.author), text: msg.body, time: fmtTime(msg.createdAt) },
          ],
        }
      })
    }
    sock.on('message:new', onNew)

    for (const c of channels) {
      if (!joinedRef.current.has(c.id)) {
        joinedRef.current.add(c.id)
        sock.emit('channel:join', { channelId: c.id })
      }
    }
    return () => {
      sock.off('message:new', onNew)
    }
  }, [channels])

  /** Persist a message via REST; the socket broadcast merges it into state. */
  const send = useCallback(
    async (channelId: string, projectId: string, text: string) => {
      if (!text.trim()) return
      const tempId = `pending-${Date.now()}`
      setMessagesByChannel((prev) => ({
        ...prev,
        [channelId]: [
          ...(prev[channelId] ?? []),
          { id: tempId, author: 'me', text: text.trim(), time: fmtTime(), pending: true },
        ],
      }))
      try {
        await api.sendChannelMessage(projectId, channelId, text.trim())
        // The broadcast will replace the optimistic entry. As a fallback for
        // the sender (who may not receive own broadcasts before re-render),
        // reconcile directly too.
      } catch {
        setMessagesByChannel((prev) => ({
          ...prev,
          [channelId]: (prev[channelId] ?? []).map((m) =>
            m.id === tempId ? { ...m, pending: false, failed: true } : m,
          ),
        }))
      }
    },
    [],
  )

  /** Create a new channel and select it. */
  const createChannel = useCallback(
    async (name: string) => {
      const chatProject = channels[0]?.projectId
      if (!chatProject) throw new Error('Chat is still loading — try again in a moment.')
      const created = await api.createChannel(chatProject, name)
      const chan: ChatChannel = {
        id: String(created.id),
        name: '#' + created.name,
        projectId: chatProject,
      }
      setChannels((prev) => [...prev, chan])
      getSocket().emit('channel:join', { channelId: chan.id })
      return chan
    },
    [channels],
  )

  return { channels, messagesByChannel, loading, error, retry: load, send, createChannel }
}
