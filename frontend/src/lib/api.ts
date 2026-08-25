/**
 * Thin fetch wrapper for yv..
 * All requests go to the real backend - there is no mock mode anymore.
 */

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
