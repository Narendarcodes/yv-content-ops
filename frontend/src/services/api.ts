/**
 * yv. frontend API client.
 *
 * Communicates with the Node/Express backend at ${process.env.REACT_APP_API_BASE_URL ||
 * 'http://localhost:3000/api/v1'}.
 *
 * All requests include the Bearer access token obtained from the session.
 * If the token is missing/expired the client falls back to the demo mock data
 * so the UI never breaks during the backend rollout.
 */
export const API_BASE =
  typeof process !== 'undefined' && process.env
    ? (process.env.REACT_APP_API_BASE_URL ||
        'http://localhost:3000/api/v1')
    : 'http://localhost:3000/api/v1'

const SESSION_KEY = 'yv.session'

// Read the persisted access token (written on login, mirrors lib/auth.writePersistedSession).
function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accessToken?: string }
    return parsed.accessToken ?? null
  } catch {
    return null
  }
}

// fetch wrapper that attaches the Bearer access token (when present) and keeps
// the cookie-based session fallback via credentials:'include'. On a 401 it
// transparently refreshes the access token (using the stored refresh token)
// and retries once, so the UI keeps showing live data past the 15-min TTL.
function getRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as { refreshToken?: string }).refreshToken ?? null
  } catch {
    return null
  }
}

function updateStoredTokens(accessToken: string, refreshToken?: string) {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, unknown>
    parsed.accessToken = accessToken
    if (refreshToken) parsed.refreshToken = refreshToken
    localStorage.setItem(SESSION_KEY, JSON.stringify(parsed))
  } catch {
    /* ignore */
  }
}

let refreshInFlight: Promise<string | null> | null = null
async function tryRefreshToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  const rt = getRefreshToken()
  if (!rt) return null
  refreshInFlight = (async () => {
    try {
      const data = await refreshToken(rt)
      // data is now unwrapped { accessToken, refreshToken }
      if (!data?.accessToken) throw new Error('No access token in refresh response')
      updateStoredTokens(data.accessToken, data.refreshToken)
      // keep cookie in sync for httpOnly fallback — backend sets cookie on login only
      return data.accessToken
    } catch (err: any) {
      const msg = String(err?.message || '')
      // Bad refresh (revoked/expired) — clear session so we don't spam refresh forever
      if (/invalid_refresh|expired_refresh|Invalid refresh/i.test(msg)) {
        try { localStorage.removeItem(SESSION_KEY) } catch {}
        // let callers see the 401; UI will redirect to /login via RequireAuth
      }
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  let res = await fetch(url, { ...options, headers, credentials: 'include' })
  if (res.status === 401) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      res = await fetch(url, { ...options, headers, credentials: 'include' })
    }
  }
  return res
}

function normalize<T extends Record<string, any>>(doc: T): T & { id: string } {
  if (!doc || typeof doc !== 'object') return doc as T & { id: string }
  const { _id, ...rest } = doc as any
  return { ...rest, id: String(_id ?? rest.id) } as T & { id: string }
}

function normalizeList<T extends Record<string, any>>(arr: T[] | undefined): (T & { id: string })[] {
  return Array.isArray(arr) ? arr.map(normalize) : []
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  title?: string
  organization?: string
  photoUrl?: string | null
  profileImage?: string | null
}

export interface Session {
  user: SessionUser
  accessToken: string
  refreshToken?: string
  loggedInAt: string
}

/** Check whether an organization name/slug is already registered (public). */
export async function checkOrgAvailability(slug: string, name: string): Promise<{ slugTaken: boolean; nameTaken: boolean }> {
  const qs = new URLSearchParams({ slug, name })
  const res = await fetch(`${API_BASE}/organizations/availability?${qs}`)
  if (!res.ok) throw new Error('Availability check failed')
  const body = await res.json()
  return body.data ?? { slugTaken: false, nameTaken: false }
}

/** Register a new user with name+email+password */
export async function register(name: string, email: string, password: string): Promise<SessionUser> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message || 'Registration failed')
  }
  const body = await res.json()
  const u = (body.data ?? {}) as SessionUser & { _id?: string }
  return { ...u, id: u.id ?? u._id ?? '' } as SessionUser
}

/** Login with email+password; returns { user, accessToken, refreshToken } */
export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // cookie-based session fallback
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || 'Login failed')
  }
  const body = (await res.json()) as { data?: Session }
  const session = body.data ?? (body as Session)
  // Persist the session so useAuth() picks it up (mirrors lib/auth.writePersistedSession).
  // Backend users use `_id`; normalize to `id` so readPersistedSession() recognizes it.
  try {
    const u = session.user as SessionUser & { _id?: string }
    const storedUser = { ...u, id: u.id ?? u._id }
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: storedUser,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        loggedInAt: new Date().toISOString(),
      }),
    )
    // Same-tab sessions never receive native storage events, so notify the
    // auth hook explicitly - otherwise RequireAuth bounces the user back
    // to /login even though sign-in succeeded.
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY }))
  } catch {
    /* storage unavailable - in-memory only */
  }
  return session
}

/** Update the signed-in user's profile (name and/or email). */
export async function updateMe(patch: { name?: string; email?: string }): Promise<SessionUser> {
  const res = await authFetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message || 'Profile update failed')
  }
  const body = await res.json()
  const u = (body.data ?? {}) as SessionUser & { _id?: string }
  return { ...u, id: u.id ?? u._id ?? '' } as SessionUser
}

/** Upload profile photo (multipart). Returns updated user. Handles 401 via refresh. */
export async function uploadProfilePhoto(file: File): Promise<SessionUser & { photoUrl?: string; profileImage?: string }> {
  const doFetch = async (withRefresh = false): Promise<Response> => {
    const token = withRefresh ? await tryRefreshToken() : getAccessToken()
    const headers: Record<string,string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const form = new FormData()
    form.append('file', file)
    // For FormData, do NOT set Content-Type — browser sets multipart boundary
    return fetch(`${API_BASE}/users/me/photo`, { method: 'PATCH', headers, body: form as any, credentials: 'include' })
  }
  let res = await doFetch(false)
  if (res.status === 401) {
    res = await doFetch(true)
  }
  if (!res.ok) { const b = await res.json().catch(()=>null); throw new Error(b?.error?.message || b?.error?.code || 'Photo upload failed') }
  const body = await res.json()
  const u = (body.data ?? {}) as any
  return { ...u, id: u.id ?? u._id ?? '' }
}

/** Remove profile photo. Returns updated user. */
export async function removeProfilePhoto(): Promise<SessionUser & { photoUrl?: string; profileImage?: string }> {
  const res = await authFetch(`${API_BASE}/users/me/photo`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) { const b = await res.json().catch(()=>null); throw new Error(b?.error?.message || 'Remove photo failed') }
  const body = await res.json()
  const u = (body.data ?? {}) as any
  return { ...u, id: u.id ?? u._id ?? '' }
}

/** Refresh the access token using a refresh token */
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message || 'Token refresh failed')
  }
  const body = await res.json()
  // Backend wraps in { data: { accessToken, refreshToken } }
  const data = body.data ?? body
  return data as { accessToken: string; refreshToken?: string }
}

/** Log out - revokes the refresh token on the server */
export async function logout(refreshToken: string): Promise<{ loggedOut: boolean }> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  return res.json()
}

/** Get the current user's profile (me endpoint) */
export async function getMe(): Promise<SessionUser> {
  const res = await authFetch(`${API_BASE}/auth/me`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch profile')
  const body = (await res.json()) as { data?: SessionUser }
  const u = body.data ?? (body as SessionUser)
  // Backend users use `_id`; normalize to `id`.
  return { ...u, id: (u as SessionUser & { _id?: string }).id ?? (u as SessionUser & { _id?: string })._id }
}

/** ------------------------------------------------------------------- */
/* Organizations */
export interface Org {
  id: string
  name: string
  slug: string
  createdAt: string
}

export interface OrgMember {
  id: string
  name: string
  email: string
  role: string
  title?: string
  lastActive?: string
}

export async function listOrgs(): Promise<Org[]> {
  const res = await authFetch(`${API_BASE}/organizations`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list organizations')
  const body = await res.json()
  return normalizeList(body.data)
}

export async function createOrg(name: string, slug: string): Promise<Org> {
  const res = await authFetch(`${API_BASE}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify({ name, slug }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to create organization')
  return res.json()
}

export async function listMembers(orgId: string): Promise<OrgMember[]> {
  const res = await authFetch(`${API_BASE}/organizations/${orgId}/members`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to list members')
  const body = await res.json()
  const items = Array.isArray(body.data) ? body.data : []
  // Membership docs carry the user under `userId` (populated). Projects
  // reference the *user* id, so expose that as `id` (not the membership id).
  return items.map((m: any) => ({
    id: String(m.userId?._id ?? m._id ?? m.id),
    name: m.name || m.userId?.name || '',
    email: m.email || m.userId?.email || '',
    role: m.role || m.userId?.role || 'member',
    title: m.title || m.userId?.title || '',
    lastActive: m.lastActive || '-',
  }))
}

export async function addMember(orgId: string, email: string, role: string): Promise<OrgMember> {
  const res = await authFetch(`${API_BASE}/organizations/${orgId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify({ email, role }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to add member')
  return res.json()
}

/** ------------------------------------------------------------------- */
/* Projects */
// Project type is defined in lib/types.ts (single source of truth).
// This interface mirrors the API response shape; callers should use
// normalizeProject() from data.ts to get the domain Project type.
export interface Project {
  id: string
  title: string
  type: string
  status: string
  assignee: string
  creator: string
  reviewers: string[]
  updated: string
  approvedVersion?: string
}

export async function listProjects(organizationId: string): Promise<Project[]> {
  const res = await authFetch(`${API_BASE}/projects?organizationId=${encodeURIComponent(organizationId)}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list projects')
  const body = await res.json()
  // Backend returns { data: [...] } or { data: { items, total } }
  const arr = Array.isArray(body.data) ? body.data : (body.data?.items ?? [])
  return normalizeList(arr)
}

export async function getProject(id: string, organizationId?: string): Promise<any> {
  const qs = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ''
  const res = await authFetch(`${API_BASE}/projects/${id}${qs}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch project')
  const body = await res.json()
  return body.data
}

export async function createProject(input: { title: string; type?: string; organizationId?: string }): Promise<Project> {
  const res = await authFetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to create project')
  const body = await res.json()
  return normalize(body.data)
}

/** ------------------------------------------------------------------- */
/* Notifications */
export interface AppNotification {
  id: string
  type: 'review' | 'comment' | 'revision' | 'approval' | 'schedule' | 'published'
  title: string
  desc: string
  time: string
  unread: boolean
}

export async function listNotifications(unreadOnly = false): Promise<AppNotification[]> {
  const res = await authFetch(`${API_BASE}/notifications?unreadOnly=${unreadOnly}`, {
    credentials: 'include',
  })
  const body = await res.json()
  if (!res.ok) throw new Error('Failed to list notifications')
  const raw: any[] = body.data ?? []
  return raw.map((n: any) => ({
    id: String(n.id ?? n._id ?? ''),
    type: n.type,
    title: n.title || '',
    desc: n.body || n.desc || '',
    time: n.time || n.createdAt || '',
    unread: n.unread ?? !n.read,
  })) as AppNotification[]
}

export async function markRead(id: string): Promise<AppNotification> {
  const res = await authFetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to mark notification read')
  const body = await res.json()
  const n = body.data
  return { id: n.id ?? n._id, type: n.type, title: n.title || '', desc: n.body || n.desc || '', time: n.createdAt, unread: false }
}

export async function markAllRead(): Promise<{ marked: number }> {
  const res = await authFetch(`${API_BASE}/notifications/read-all`, {
    method: 'PATCH',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to mark all read')
  return res.json()
}

export async function unreadCount(): Promise<{ unread: number }> {
  const res = await authFetch(`${API_BASE}/notifications/unread-count`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch unread count')
  return res.json()
}

/** ------------------------------------------------------------------- */
/* Chat (WhatsApp imports land here, hosted under a "Team Chat" project) */
export async function listProjectChannels(projectId: string) {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/channels`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list channels')
  const body = await res.json()
  return normalizeList(body.data)
}

export async function listChannelMessages(projectId: string, channelId: string) {
  const res = await authFetch(
    `${API_BASE}/projects/${projectId}/channels/${channelId}/messages`,
    { credentials: 'include' },
  )
  if (!res.ok) throw new Error('Failed to list messages')
  const body = await res.json()
  const items = body.data?.items ?? body.data ?? []
  return normalizeList(items)
}

/** ------------------------------------------------------------------- */
/* Version files (video drafts) */
export interface VersionFile {
  id: string
  filename: string
  mimeType: string
  size: number
}

export interface ProjectVersion {
  id: string
  versionNumber: number
  changeSummary: string
  createdAt: string
  files: VersionFile[]
}

/**
 * Authenticated URL for streaming a version file (Range-aware).
 * Appends ?token= because <video>/<audio> src attributes cannot send
 * Authorization headers or reliably carry the httpOnly cookie — the
 * backend authenticate middleware accepts the query-param fallback.
 */
export function versionFileUrl(projectId: string, versionId: string, fileId: string): string {
  const base = `${API_BASE}/projects/${projectId}/versions/${versionId}/files/${fileId}`
  const token = getAccessToken()
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

async function authedJson<T>(url: string): Promise<T> {
  const res = await authFetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Request failed')
  const body = await res.json()
  const data = body?.data ?? body
  return (Array.isArray(data) ? data : data?.items ?? []) as T
}

export async function listVersions(projectId: string): Promise<ProjectVersion[]> {
  const raw = await authedJson<any[]>(`${API_BASE}/projects/${projectId}/versions`)
  return raw.map((v) => ({
    id: String(v._id ?? v.id),
    versionNumber: v.versionNumber,
    changeSummary: v.changeSummary ?? '',
    createdAt: v.createdAt,
    files: (v.files ?? []).map((f: any) => ({
      id: String(f._id),
      filename: f.filename,
      mimeType: f.mimeType,
      size: f.size,
    })),
  }))
}

/** Create a new version entry for a project. */
export async function createVersion(projectId: string, changeSummary: string): Promise<ProjectVersion> {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changeSummary }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to create version')
  const body = await res.json()
  const v = body.data
  return {
    id: String(v._id ?? v.id),
    versionNumber: v.versionNumber,
    changeSummary: v.changeSummary ?? '',
    createdAt: v.createdAt,
    files: (v.files ?? []).map((f: any) => ({
      id: String(f._id),
      filename: f.filename,
      mimeType: f.mimeType,
      size: f.size,
    })),
  }
}

/** Upload a file to an existing version (multipart form). Retries once with a refreshed token on 401. */
export async function uploadVersionFile(
  projectId: string,
  versionId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ id: string; filename: string; mimeType: string; size: number }[]> {
  const doUpload = (token: string | null) =>
    new Promise<{ id: string; filename: string; mimeType: string; size: number }[]>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/projects/${projectId}/versions/${versionId}/files`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.withCredentials = true
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      })
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText)
            const files = (body.data?.files ?? body.files ?? []).map((f: any) => ({
              id: String(f._id),
              filename: f.filename,
              mimeType: f.mimeType,
              size: f.size,
            }))
            resolve(files)
          } catch {
            reject(new Error('Failed to parse upload response'))
          }
        } else {
          let msg = `Upload failed (${xhr.status})`
          try {
            const body = JSON.parse(xhr.responseText)
            msg = body?.error?.message || body?.error?.code || msg
          } catch {}
          reject(new Error(msg))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      const formData = new FormData()
      formData.append('file', file)
      xhr.send(formData)
    })

  try {
    return await doUpload(getAccessToken())
  } catch (err: any) {
    const msg = String(err?.message || '')
    if (/401|Invalid token|invalid_token|expired/i.test(msg)) {
      const newToken = await tryRefreshToken()
      if (newToken) return await doUpload(newToken)
    }
    throw err
  }
}

/** ------------------------------------------------------------------- */
/* Concepts (idea pipeline before projects) */
export interface Concept {
  id: string
  title: string
  description: string
  type: 'New Concept' | 'Experiment' | 'Revision'
  status: 'IDEA' | 'APPROVED' | 'DECLINED'
  proposerName?: string | null
  approvedProjectId?: string | null
  createdAt?: string
}

export async function listConcepts(orgId: string): Promise<Concept[]> {
  const res = await authFetch(`${API_BASE}/organizations/${orgId}/concepts`)
  if (!res.ok) throw new Error(`listConcepts failed (${res.status})`)
  const json = await res.json()
  return json.data ?? []
}

export async function createConcept(
  orgId: string,
  input: { title: string; description: string; type: Concept['type'] },
): Promise<Concept> {
  const res = await authFetch(`${API_BASE}/organizations/${orgId}/concepts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`createConcept failed (${res.status})`)
  return (await res.json()).data
}

export async function approveConcept(orgId: string, conceptId: string): Promise<{ projectId: string }> {
  const res = await authFetch(`${API_BASE}/organizations/${orgId}/concepts/${conceptId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`approveConcept failed (${res.status})`)
  const json = await res.json()
  return { projectId: json.data.projectId }
}

export async function declineConcept(orgId: string, conceptId: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/organizations/${orgId}/concepts/${conceptId}/decline`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`declineConcept failed (${res.status})`)
}

/** Send a chat message to a channel (persisted server-side). */
export async function sendChannelMessage(projectId: string, channelId: string, body: string) {
  const res = await authFetch(
    `${API_BASE}/projects/${projectId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
      credentials: 'include',
    },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message || 'Failed to send message')
  }
  const payload = await res.json()
  return normalize(payload.data)
}

/** Create a channel under the Team Chat project. */
export async function createChannel(projectId: string, name: string) {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message || 'Failed to create channel')
  }
  const payload = await res.json()
  return normalize(payload.data)
}

/** ------------------------------------------------------------------- */
/* Tasks (kanban) */
export interface TaskItem {
  id: string
  projectId: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  dueDate?: string | null
}

export async function listTasks(projectId: string): Promise<TaskItem[]> {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/tasks`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list tasks')
  const body = await res.json()
  const items = Array.isArray(body.data) ? body.data : (body.data?.items ?? [])
  return normalizeList(items) as TaskItem[]
}

/** ------------------------------------------------------------------- */
/* Comments / reviews */
export interface CommentItem {
  id: string
  projectId: string
  author: string
  body: string
  resolved: boolean
  createdAt?: string
}

export async function listComments(projectId: string): Promise<CommentItem[]> {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/comments`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list comments')
  const body = await res.json()
  const items = Array.isArray(body.data) ? body.data : (body.data?.items ?? [])
  return normalizeList(items) as CommentItem[]
}

/** ------------------------------------------------------------------- */
/* Project sub-resources (inputs, metrics, publications, activity) */
export async function listInputs(projectId: string) {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/inputs`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list inputs')
  const body = await res.json()
  return normalizeList(Array.isArray(body.data) ? body.data : (body.data?.items ?? []))
}

export async function listMetrics(projectId: string) {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/metrics`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list metrics')
  const body = await res.json()
  return normalizeList(Array.isArray(body.data) ? body.data : (body.data?.items ?? []))
}

export async function listPublications(projectId: string) {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/publications`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list publications')
  const body = await res.json()
  return normalizeList(Array.isArray(body.data) ? body.data : (body.data?.items ?? []))
}

export async function listActivity(projectId: string) {
  const res = await authFetch(`${API_BASE}/projects/${projectId}/activity`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list activity')
  const body = await res.json()
  return normalizeList(Array.isArray(body.data) ? body.data : (body.data?.items ?? []))
}

/** Org-wide activity feed (dashboard "Recent activity") — events across all org projects. */
export async function listOrgActivity(orgId: string, limit = 20) {
  const res = await authFetch(`${API_BASE}/organizations/${orgId}/activity?limit=${limit}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to list org activity')
  const body = await res.json()
  return normalizeList(Array.isArray(body.data) ? body.data : (body.data?.items ?? []))
}

/** ------------------------------------------------------------------- */
/* Fallback to demo mock data when the backend is unavailable */
export interface MockResponse<T> {
  data: T
  fallback: true
}