'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'
import { NewsletterTabs } from './NewsletterTabs'

type Subscriber = {
  id: number
  email: string
  status: 'pending' | 'active' | 'unsubscribed' | 'bounced'
  subscribedAt: string
  confirmedAt: string | null
}
type List = { items: Subscriber[]; total: number; page: number; pages: number; counts: Record<string, number> }

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  unsubscribed: 'bg-stone-200 text-stone-600',
  bounced: 'bg-red-100 text-red-800',
}

export function NewsletterSubscriberList() {
  const [list, setList] = useState<List | null>(null)
  const [s, setS] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const load = () => {
    const params = new URLSearchParams({ page: String(page) })
    if (s) params.set('s', s)
    if (status) params.set('status', status)
    adminApi<List>(`/admin/newsletter/subscribers?${params}`).then(setList)
  }

  useEffect(() => {
    const t = setTimeout(load, s ? 300 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, s, status])

  async function remove(id: number) {
    if (!confirm('Remove this subscriber?')) return
    await adminApi(`/admin/newsletter/subscribers/${id}`, { method: 'DELETE' })
    load()
  }

  const counts = list?.counts || {}

  const exportParams = new URLSearchParams()
  if (s) exportParams.set('s', s)
  if (status) exportParams.set('status', status)
  const exportHref = `/api/admin/newsletter/subscribers/export${exportParams.toString() ? `?${exportParams}` : ''}`

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Newsletter Subscribers</h1>
        <a href={exportHref} className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50">
          Export CSV
        </a>
      </div>

      <NewsletterTabs />

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-md border border-stone-200 bg-white px-3 py-1.5">Active: <b>{counts.active || 0}</b></span>
        <span className="rounded-md border border-stone-200 bg-white px-3 py-1.5">Pending: <b>{counts.pending || 0}</b></span>
        <span className="rounded-md border border-stone-200 bg-white px-3 py-1.5">Unsubscribed: <b>{counts.unsubscribed || 0}</b></span>
        <span className="rounded-md border border-stone-200 bg-white px-3 py-1.5">Bounced: <b>{counts.bounced || 0}</b></span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={s}
          onChange={(e) => { setS(e.target.value); setPage(1) }}
          placeholder="Search email…"
          className="admin-input max-w-xs"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="admin-input max-w-48">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left">
              <th className="px-4 py-3">Email</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Subscribed</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list?.items.map((sub) => (
              <tr key={sub.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-3">{sub.email}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[sub.status]}`}>{sub.status}</span>
                </td>
                <td className="px-3 py-3 text-stone-500">{new Date(sub.subscribedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(sub.id)} className="text-red-600 hover:underline">Remove</button>
                </td>
              </tr>
            ))}
            {list && !list.items.length && (
              <tr><td colSpan={4} className="py-10 text-center text-stone-400">No subscribers yet.</td></tr>
            )}
          </tbody>
        </table>
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
