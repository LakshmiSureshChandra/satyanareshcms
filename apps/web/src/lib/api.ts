// Server-side fetch helper for the Express API.
const API = process.env.API_URL || 'http://localhost:4000'

export async function api<T = any>(path: string, revalidate: number | false = 3600): Promise<T> {
  const res = await fetch(`${API}/api${path}`, {
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  })
  if (res.status === 404) throw new NotFoundError()
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json()
}

export class NotFoundError extends Error {}

export function imageUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('http')) return path
  // relative to same origin; Next proxies /uploads to Express. metadataBase in the
  // root layout resolves these to absolute for OG/JSON-LD.
  return `${process.env.NEXT_PUBLIC_API_URL ?? ''}${path}`
}

export type PostCard = {
  id: number
  title: string
  slug: string
  bannerImage: string | null
  publishedAt: string
  tags: string | null
  metaDescription: string | null
  categories: { id: number; name: string; slug: string }[]
}

export type MenuItem = {
  id: number
  title: string
  url: string
  newWindow: boolean
  children: MenuItem[]
}

export type CategoryNode = {
  id: number
  name: string
  slug: string
  postCount: number
  children: CategoryNode[]
}

export type Settings = Record<string, string>
