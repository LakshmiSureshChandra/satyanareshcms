import type { MetadataRoute } from 'next'
import { api } from '@/lib/api'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await api<{
    posts: { slug: string; type: 'post' | 'page'; updatedAt: string }[]
    categories: { slug: string; updatedAt: string }[]
    galleryAlbums: { slug: string; updatedAt: string }[]
  }>('/sitemap-data', 3600)

  // defensive: never let the build crash because a deploy briefly ran this
  // against an API that hasn't picked up a new field/route yet
  return [
    { url: SITE, changeFrequency: 'hourly', priority: 1 },
    ...(data.posts || []).map((p) => ({
      url: p.type === 'page' ? `${SITE}/page/${p.slug}` : `${SITE}/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      priority: p.type === 'page' ? 0.4 : 0.8,
    })),
    ...(data.categories || []).map((c) => ({
      url: `${SITE}/category/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      priority: 0.6,
    })),
    ...(data.galleryAlbums || []).map((a) => ({
      url: `${SITE}/gallery/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      priority: 0.5,
    })),
  ]
}
