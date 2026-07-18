'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi, apiOrigin } from '@/lib/admin-api'

type Category = { id: number; name: string; parentId: number | null }
type Album = {
  id: number
  title: string
  slug: string
  coverImage: string | null
  status: boolean
  publishedAt: string | null
  photoCount: number
  category: Category | null
}
type List = { items: Album[]; total: number; page: number; pages: number }

export function GalleryAlbumList() {
  const [list, setList] = useState<List | null>(null)
  const [s, setS] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [page, setPage] = useState(1)
  const [enabled, setEnabled] = useState(false)
  const [toggleBusy, setToggleBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = () => {
    const params = new URLSearchParams({ page: String(page) })
    if (s) params.set('s', s)
    if (categoryFilter) params.set('category', categoryFilter)
    adminApi<List>(`/admin/gallery?${params}`).then(setList)
  }

  useEffect(() => {
    const t = setTimeout(load, s ? 300 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, s, categoryFilter])

  useEffect(() => {
    adminApi<Record<string, string>>('/admin/settings').then((set) => {
      setEnabled(set.gallery_enabled === 'true')
      setLoaded(true)
    })
    adminApi<Category[]>('/admin/gallery/categories').then(setCategories)
  }, [])

  async function toggleEnabled() {
    setToggleBusy(true)
    const next = !enabled
    await adminApi('/admin/settings', { method: 'PUT', body: { gallery_enabled: String(next) } })
    setEnabled(next)
    setToggleBusy(false)
  }

  async function remove(a: Album) {
    if (!confirm(`Move "${a.title}" to trash?`)) return
    await adminApi(`/admin/gallery/${a.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Albums</h1>
        <Link href="/admin/gallery/new" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          + New Album
        </Link>
      </div>

      {loaded && (
        <label className="mb-4 flex items-center gap-3 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            disabled={toggleBusy}
            onChange={toggleEnabled}
            className="h-4 w-4 accent-stone-900"
          />
          <span className="font-medium">Show the Gallery page on the site</span>
          <span className="text-stone-400">
            — {enabled ? 'visible at /gallery' : 'hidden — /gallery currently shows a 404 to visitors'}
          </span>
        </label>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={s}
          onChange={(e) => { setS(e.target.value); setPage(1) }}
          placeholder="Search albums…"
          className="admin-input max-w-xs"
        />
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="admin-input max-w-48">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>)}
        </select>
      </div>

      {!categories.length && loaded && (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Create a category first (Categories tab) — every album needs one.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list?.items.map((a) => (
          <div key={a.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            {a.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${apiOrigin}${a.coverImage}`} alt={a.title} className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-stone-100 text-stone-300">No cover</div>
            )}
            <div className="p-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {a.status ? 'Published' : 'Draft'}
                </span>
                <span className="text-xs text-stone-400">{a.photoCount} photo{a.photoCount === 1 ? '' : 's'}</span>
                {a.category && <span className="ml-auto text-xs text-stone-400">{a.category.name}</span>}
              </div>
              <Link href={`/admin/gallery/${a.id}/edit`} className="mt-1.5 block truncate font-medium hover:underline">{a.title}</Link>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <Link href={`/admin/gallery/${a.id}/edit`} className="text-stone-600 hover:underline">Edit</Link>
                <button onClick={() => remove(a)} className="ml-auto text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {list && !list.items.length && <p className="col-span-full py-10 text-center text-sm text-stone-400">No albums yet.</p>}
      </div>

      {list && list.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-stone-300 px-3 py-1 disabled:opacity-40">←</button>
          <span>Page {list.page} of {list.pages}</span>
          <button disabled={page >= list.pages} onClick={() => setPage(page + 1)} className="rounded border border-stone-300 px-3 py-1 disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  )
}
