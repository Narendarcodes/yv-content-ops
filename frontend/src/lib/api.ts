/**
 * API client for Aaryajanani.
 *
 * MOCK-FIRST: The backend integration comes in a later phase (requires approval).
 * Until then every module consumes `mockApi`, which returns the exact response
 * envelope the real backend uses: `{ data: ... }` on success, `{ error: { code, message } }`
 * on failure. Swapping to `realApi` later is a one-line change per call site.
 */

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const err: ApiError = body?.error ?? { code: 'request_failed', message: 'Request failed' }
    throw new Error(err.message)
  }
  return body?.data as T
}

export { USE_MOCK }
