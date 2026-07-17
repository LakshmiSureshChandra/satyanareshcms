'use client'

// Client-side fetch helper for the admin panel (cookie auth).
// Empty base = same origin; Next proxies /api and /uploads to Express (see next.config.ts).
const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function adminApi<T = any>(
  path: string,
  opts: { method?: string; body?: any; formData?: FormData } = {}
): Promise<T> {
  const res = await fetch(`${API}/api${path}`, {
    method: opts.method || 'GET',
    credentials: 'include',
    cache: 'no-store', // admin data must never be served stale/cached
    headers: opts.formData ? undefined : opts.body ? { 'content-type': 'application/json' } : undefined,
    body: opts.formData || (opts.body ? JSON.stringify(opts.body) : undefined),
  })
  if (res.status === 401) {
    window.location.href = '/admin/login'
    throw new ApiError('Session expired', 401)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
  return data
}

export function uploadImage(file: File): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  return adminApi('/admin/upload', { method: 'POST', formData: fd })
}

export const apiOrigin = API
