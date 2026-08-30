/**
 * Data access layer for yv..
 *
 * REAL DATA ONLY: every loader talks to the backend API. There are no mock
 * fallbacks anymore - if the backend is unreachable or returns nothing, the
 * hooks surface an empty state so the UI never invents data that isn't in
 * the database.
 */
import { useEffect, useState } from 'react'
import * as api from '../services/api'
import type { Project, TeamMember } from './types'

/* ----------------------------- helpers ----------------------------- */
function strId(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && '_id' in (v as any)) return String((v as any)._id)
  return String(v)
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function relativeTime(iso?: string | Date): string {
  if (!iso) return '-'
  const d = new Date(iso as string)
  if (isNaN(d.getTime())) return '-'
  const diff = Date.now() - d.getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.round(h / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}

function fmtDate(iso?: string | Date): string {
  if (!iso) return ''
  const d = new Date(iso as string)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Resolve the current user's primary org id (no orgId needed from caller). */
let orgIdCache: string | null = null
export function invalidateOrgCache() {
  orgIdCache = null
}
/** Resolve the current user's primary org id (no orgId needed from caller). */
export async function primaryOrgId(): Promise<string | null> {
  if (orgIdCache) return orgIdCache
  try {
    const orgs = await api.listOrgs()
    if (orgs && orgs.length) {
      orgIdCache = orgs[0].id
      return orgIdCache
    }
  } catch {
    /* not authenticated yet - retry on next call */
  }
  return null
}

/** Clear all session caches (called on login/logout so data is refetched). */
export function clearDataCaches() {
  invalidateOrgCache()
  teamPromise = null
  projectsPromise = null
  boardPromise = null
  reviewsPromise = null
  analyticsPromise = null
  for (const key of Object.keys(projectPromiseCache)) delete projectPromiseCache[key]
  emitProjectsChanged()
}

/* ------------------------------ team ------------------------------ */
let teamPromise: Promise<TeamMember[]> | null = null
export async function loadTeam(): Promise<TeamMember[]> {
  if (teamPromise) return teamPromise
  const run = async (): Promise<TeamMember[]> => {
    const orgId = await primaryOrgId()
    if (!orgId) return []
    const members = await api.listMembers(orgId)
    return members.map((m: any) => ({
      id: strId(m.id),
      name: m.name,
      initials: initialsOf(m.name || ''),
      email: m.email,
      role: m.role || 'member',
      title: m.title || '',
      lastActive: m.lastActive || 'Never',
    }))
  }
  teamPromise = run().catch(() => {
    teamPromise = null // allow retry on next call
    return [] as TeamMember[]
  })
  return teamPromise
}

/* ----------------------------- projects ----------------------------- */
function normalizeProject(p: any): Project {
  return {
    id: strId(p._id ?? p.id),
    title: p.title,
    type: (p.type || 'Content Production') as Project['type'],
    status: p.status || 'IDEA',
    description: p.description || '',
    assignee: strId(p.assignee),
    creator: strId(p.creator),
    reviewers: Array.isArray(p.reviewers) ? p.reviewers.map(strId) : [],
    updated: relativeTime(p.updatedAt || p.createdAt),
    scheduleDate: p.scheduledAt ? fmtDate(p.scheduledAt) : undefined,
    platform: p.platform,
    postUrl: p.postUrl,
    publishedAt: p.publishedAt ? fmtDate(p.publishedAt) : undefined,
    approvedVersion: p.approvedVersion,
  }
}

const projectsListeners = new Set<() => void>()
function emitProjectsChanged() {
  projectsListeners.forEach((l) => l())
}

let projectsPromise: Promise<Project[]> | null = null
export async function loadProjects(): Promise<Project[]> {
  if (projectsPromise) return projectsPromise
  const run = async (): Promise<Project[]> => {
    const orgId = await primaryOrgId()
    if (!orgId) return []
    const projects = await api.listProjects(orgId)
    return (projects || []).map(normalizeProject)
  }
  projectsPromise = run().catch(() => {
    projectsPromise = null // allow retry on next call
    return [] as Project[]
  })
  return projectsPromise
}

export async function createProject(input: { title: string; type?: string; organizationId?: string }): Promise<Project> {
  const created = await api.createProject(input)
  projectsPromise = null
  emitProjectsChanged()
  return normalizeProject(created ?? {})
}

/* ------------------------------- hooks ------------------------------- */
export function useTeam() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [org, setOrg] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    loadTeam()
      .then((t) => {
        if (!active) return
        setTeam(t)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    api
      .listOrgs()
      .then((orgs) => active && orgs && orgs.length && setOrg(orgs[0]))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const memberOf = (id: string) => team.find((m) => m.id === id)
  return { team, org, memberOf, loading }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    const fetchProjects = () => {
      setLoading(true)
      setError(false)
      loadProjects()
        .then((p) => {
          if (!active) return
          setProjects(p)
          setLoading(false)
        })
        .catch(() => {
          if (!active) return
          setError(true)
          setLoading(false)
        })
    }
    const listener = () => fetchProjects()
    projectsListeners.add(listener)
    fetchProjects()
    return () => {
      active = false
      projectsListeners.delete(listener)
    }
  }, [])
  return { projects, loading, error, retry: loadProjects }
}

/** Members view-list shape (role capitalized) used by the Members screen. */
export function useMembers() {
  const { team, org } = useTeam()
  const members = team.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    initials: m.initials,
    role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
    lastActive: m.lastActive,
  }))
  return { members, org }
}

export function useChat() {
  const [channels, setChannels] = useState<any[]>([])
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, any[]>>({})
  useEffect(() => {
    let active = true
    ;(async () => {
      const orgId = await primaryOrgId()
      if (!orgId) return
      try {
        const projects = await api.listProjects(orgId)
        const chatProject = projects.find((p: any) => p.title === TEAM_CHAT_TITLE)
        if (!chatProject) return
        const chans = await api.listProjectChannels(chatProject.id)
        if (!chans || !chans.length) return
        const messages: Record<string, any[]> = {}
        for (const ch of chans) {
          const msgs = await api.listChannelMessages(chatProject.id, ch.id)
          messages[ch.id] = msgs.map((m: any) => ({
            id: strId(m.id),
            author: strId(m.author?._id ?? m.author),
            text: m.body,
            time: new Date(m.sentAt || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        }
        if (active) {
          setChannels(chans.map((c: any) => ({ id: strId(c.id), name: '#' + c.name, desc: '', unread: 0 })))
          setMessagesByChannel(messages)
        }
      } catch {
        /* leave empty state */
      }
    })()
    return () => {
      active = false
    }
  }, [])
  return { channels, messagesByChannel }
}
const TEAM_CHAT_TITLE = 'Team Chat'

/* ------------------------------- board ------------------------------- */
export interface BoardTask {
  id: string
  projectId: string
  projectTitle: string
  title: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  due?: string
}

let boardPromise: Promise<BoardTask[]> | null = null
export async function loadBoard(): Promise<BoardTask[]> {
  if (boardPromise) return boardPromise
  const run = async (): Promise<BoardTask[]> => {
    const orgId = await primaryOrgId()
    if (!orgId) return []
    const projects = await api.listProjects(orgId)
    const tasks: BoardTask[] = []
    for (const p of projects) {
      const ts = await api.listTasks(p.id)
      for (const t of ts) {
        tasks.push({
          id: strId(t.id),
          projectId: strId(t.projectId),
          projectTitle: p.title,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: strId(t.assignee),
          due: t.dueDate ? fmtDate(t.dueDate) : undefined,
        })
      }
    }
    return tasks
  }
  boardPromise = run().catch(() => {
    boardPromise = null
    return [] as BoardTask[]
  })
  return boardPromise
}

export function useBoard() {
  const [tasks, setTasks] = useState<BoardTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    loadBoard()
      .then((t) => {
        if (!active) return
        setTasks(t)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(true)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  return { tasks, loading, error }
}

/* ------------------------------ reviews ------------------------------ */
export interface ReviewItem {
  id: string
  projectId: string
  projectTitle: string
  author: string
  body: string
  resolved: boolean
  createdAt?: string
}

let reviewsPromise: Promise<ReviewItem[]> | null = null
export async function loadReviews(): Promise<ReviewItem[]> {
  if (reviewsPromise) return reviewsPromise
  const run = async (): Promise<ReviewItem[]> => {
    const orgId = await primaryOrgId()
    if (!orgId) return []
    const projects = await api.listProjects(orgId)
    const items: ReviewItem[] = []
    for (const p of projects) {
      const cs = await api.listComments(p.id)
      for (const c of cs) {
        items.push({
          id: strId(c.id),
          projectId: strId(c.projectId),
          projectTitle: p.title,
          author: strId((c as any).author?._id ?? (c as any).author),
          body: c.body,
          resolved: !!c.resolved,
          createdAt: c.createdAt,
        })
      }
    }
    return items
  }
  reviewsPromise = run().catch(() => {
    reviewsPromise = null
    return [] as ReviewItem[]
  })
  return reviewsPromise
}

export function useReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  useEffect(() => {
    let active = true
    loadReviews().then((r) => active && setReviews(r)).catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return { reviews }
}

/* --------------------------- single project --------------------------- */
const projectPromiseCache: Record<string, Promise<Project | null>> = {}
export async function loadProject(id: string): Promise<Project | null> {
  const cached = projectPromiseCache[id]
  if (cached) return cached
  const run = async (): Promise<Project | null> => {
    const orgId = await primaryOrgId()
    if (!orgId) return null
    const p = await api.getProject(id, orgId)
    return p ? normalizeProject(p) : null
  }
  projectPromiseCache[id] = run().catch(() => null)
  return projectPromiseCache[id]
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    if (id) loadProject(id).then((p) => active && setProject(p)).catch(() => {}).finally(() => active && setLoading(false))
    else setLoading(false)
    return () => {
      active = false
    }
  }, [id])
  return { project, loading }
}

/* ----------------------- project sub-resources ----------------------- */
export function useProjectInputs(projectId: string) {
  const [inputs, setInputs] = useState<any[]>([])
  useEffect(() => {
    let active = true
    if (!projectId) return
    api.listInputs(projectId).then((d) => active && setInputs(d)).catch(() => {})
    return () => {
      active = false
    }
  }, [projectId])
  return { inputs }
}

export function useProjectMetrics(projectId: string) {
  const [metrics, setMetrics] = useState<any[]>([])
  useEffect(() => {
    let active = true
    if (!projectId) return
    api.listMetrics(projectId).then((d) => active && setMetrics(d)).catch(() => {})
    return () => {
      active = false
    }
  }, [projectId])
  return { metrics }
}

export function useProjectPublications(projectId: string) {
  const [publications, setPublications] = useState<any[]>([])
  useEffect(() => {
    let active = true
    if (!projectId) return
    api.listPublications(projectId).then((d) => active && setPublications(d)).catch(() => {})
    return () => {
      active = false
    }
  }, [projectId])
  return { publications }
}

export function useProjectActivity(projectId: string) {
  const [activity, setActivity] = useState<any[]>([])
  useEffect(() => {
    let active = true
    if (!projectId) return
    api.listActivity(projectId).then((d) => active && setActivity(d)).catch(() => {})
    return () => {
      active = false
    }
  }, [projectId])
  return { activity }
}

/* ----------------------- concepts & my work ----------------------- */
export function useConcepts() {
  const { projects } = useProjects()
  return { concepts: projects.filter((p) => p.status === 'IDEA') }
}

/**
 * The signed-in member's record within the org team list, matched against
 * the authenticated session user - never a demo viewer.
 */
export function useMe() {
  const { session } = useAuthSafe()
  const { team } = useTeam()
  const myEmail = session?.user?.email?.toLowerCase()
  const me = team.find((m) => m.email.toLowerCase() === myEmail) ?? null
  return me
}

// Local import indirection to avoid a circular import at module init.
import { useAuth } from './auth'
function useAuthSafe() {
  return useAuth()
}

export function useMyWork() {
  const me = useMe()
  const { projects } = useProjects()
  const { team } = useTeam()
  const mine = me ? projects.filter((p) => p.assignee === me.id) : []
  return { myWork: mine, team }
}

/* ----------------------------- analytics ----------------------------- */
export interface AnalyticsRow {
  projectId: string
  title: string
  platform: string
  posted: string
  views: number
  likes: number
  comments: number
  shares: number
  postUrl?: string
}

let analyticsPromise: Promise<AnalyticsRow[]> | null = null
export async function loadAnalytics(): Promise<AnalyticsRow[]> {
  if (analyticsPromise) return analyticsPromise
  const run = async (): Promise<AnalyticsRow[]> => {
    const orgId = await primaryOrgId()
    if (!orgId) return []
    const projects = await api.listProjects(orgId)
    const published: any[] = projects.filter((p: any) => p.status === 'PUBLISHED')
    const rows: AnalyticsRow[] = []
    for (const p of published) {
      const pubs = await api.listPublications(p.id)
      const metrics = await api.listMetrics(p.id)
      const sum = (m: string) => metrics.filter((x: any) => x.metric === m).reduce((s: number, x: any) => s + (x.value || 0), 0)
      const pub = pubs[0]
      rows.push({
        projectId: strId(p.id),
        title: p.title,
        platform: pub?.platform ?? p.platform ?? '-',
        posted: pub?.publishedAt ? fmtDate(pub.publishedAt) : p.publishedAt ? fmtDate(p.publishedAt) : '-',
        views: sum('views'),
        likes: sum('likes'),
        comments: sum('comments'),
        shares: sum('shares'),
        postUrl: pub?.postUrl,
      })
    }
    return rows
  }
  analyticsPromise = run().catch(() => {
    analyticsPromise = null
    return [] as AnalyticsRow[]
  })
  return analyticsPromise
}

export function useAnalytics() {
  const [rows, setRows] = useState<AnalyticsRow[]>([])
  useEffect(() => {
    let active = true
    loadAnalytics().then((r) => active && setRows(r)).catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return { rows }
}
