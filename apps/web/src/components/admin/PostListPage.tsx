'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'

type Row = {
  id: number
  title: string
  slug: string
  status: boolean
  publishedAt: string | null
  views: number
  audioPlays: number
  author: { name: string } | null
  categories: string[]
}
type List = { items: Row[]; total: number; page: number; pages: number }

export function PostListPage({ kind }: { kind: 'post' | 'page' }) {
  const apiBase = kind === 'post' ? '/admin/posts' : '/admin/pages'
  const uiBase = kind === 'post' ? '/admin/posts' : '/admin/pages'
  const [list, setList] = useState<List | null>(null)
  const [s, setS] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page) })
    if (s) params.set('s', s)
    if (status) params.set('status', status)
    adminApi<List>(`${apiBase}?${params}`).then((d) => { setList(d); setSelected([]) })
  }, [apiBase, page, s, status])

  useEffect(() => {
    const t = setTimeout(load, s ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, s])

  const rows = list?.items ?? []
  const allChecked = rows.length > 0 && selected.length === rows.length
  const toggleAll = () => setSelected(allChecked ? [] : rows.map((r) => r.id))
  const toggle = (id: number) => setSelected((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

  async function remove(row: Row) {
    if (!confirm(`Move "${row.title}" to trash?`)) return
    await adminApi(`${apiBase}/${row.id}`, { method: 'DELETE' })
    load()
  }

  async function bulkDelete() {
    if (!confirm(`Move ${selected.length} ${kind === 'post' ? 'post(s)' : 'page(s)'} to trash?`)) return
    await adminApi(`${apiBase}/bulk-delete`, { method: 'POST', body: { ids: selected } })
    load()
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{kind === 'post' ? 'Posts' : 'Pages'}</h1>
        <Link href={`${uiBase}/new`} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          + New {kind === 'post' ? 'Post' : 'Page'}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={s}
          onChange={(e) => { setS(e.target.value); setPage(1) }}
          placeholder="Search title…"
          className="admin-input max-w-xs"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="admin-input max-w-40">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-md bg-stone-200 px-4 py-2 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <button onClick={bulkDelete} className="ml-auto font-semibold text-red-700 hover:underline">Delete selected</button>
          <button onClick={() => setSelected([])} className="text-stone-600 hover:underline">Clear</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-stone-900" aria-label="Select all" />
              </th>
              <th className="px-2 py-3">Title</th>
              {kind === 'post' && <th className="px-3 py-3">Categories</th>}
              <th className="px-3 py-3">Author</th>
              <th className="px-3 py-3">Status</th>
              {kind === 'post' && <th className="px-3 py-3 text-right">Views</th>}
              {kind === 'post' && <th className="px-3 py-3 text-right">Audio Plays</th>}
              <th className="px-3 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`border-b border-stone-100 last:border-0 hover:bg-stone-50 ${selected.includes(row.id) ? 'bg-stone-50' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} className="h-4 w-4 accent-stone-900" aria-label={`Select ${row.title}`} />
                </td>
                <td className="max-w-md px-2 py-3">
                  <Link href={`${uiBase}/${row.id}/edit`} className="line-clamp-1 font-medium hover:underline">{row.title}</Link>
                </td>
                {kind === 'post' && <td className="px-3 py-3 text-stone-500">{row.categories.join(', ')}</td>}
                <td className="px-3 py-3 text-stone-500">{row.author?.name || '—'}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.status ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {row.status ? 'Published' : 'Draft'}
                  </span>
                </td>
                {kind === 'post' && <td className="px-3 py-3 text-right text-stone-500">{row.views}</td>}
                {kind === 'post' && <td className="px-3 py-3 text-right text-stone-500">{row.audioPlays}</td>}
                <td className="px-3 py-3 text-stone-500">
                  {row.publishedAt ? new Date(row.publishedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={kind === 'post' ? `/${row.slug}` : `/page/${row.slug}`}
                    target="_blank"
                    className="mr-3 text-stone-400 hover:text-stone-700"
                  >
                    View
                  </a>
                  <Link href={`${uiBase}/${row.id}/edit`} className="mr-3 text-stone-600 hover:underline">Edit</Link>
                  <button onClick={() => remove(row)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {list && !rows.length && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-stone-400">Nothing found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {list && list.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-stone-300 px-3 py-1 disabled:opacity-40">←</button>
          <span>Page {list.page} of {list.pages}</span>
          <button disabled={page >= list.pages} onClick={() => setPage(page + 1)} className="rounded border border-stone-300 px-3 py-1 disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  )
}
