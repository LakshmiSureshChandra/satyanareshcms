'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'

type Enquiry = {
  id: number
  name: string
  email: string
  company: string | null
  phone: string | null
  message: string | null
  handled: boolean
  createdAt: string
}

export default function EnquiriesPage() {
  const [items, setItems] = useState<Enquiry[]>([])
  const [open, setOpen] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'new'>('all')

  const load = () => adminApi<Enquiry[]>('/admin/enquiries').then(setItems)
  useEffect(() => { load() }, [])

  async function toggleHandled(e: Enquiry) {
    await adminApi(`/admin/enquiries/${e.id}`, { method: 'PATCH', body: { handled: !e.handled } })
    load()
  }

  async function remove(e: Enquiry) {
    if (!confirm(`Delete enquiry from ${e.name}?`)) return
    await adminApi(`/admin/enquiries/${e.id}`, { method: 'DELETE' })
    setOpen(null)
    load()
  }

  const shown = filter === 'new' ? items.filter((i) => !i.handled) : items
  const newCount = items.filter((i) => !i.handled).length

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Enquiries
          {newCount > 0 && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{newCount} new</span>}
        </h1>
        <div className="flex gap-1 rounded-md border border-stone-300 p-0.5 text-sm">
          <button onClick={() => setFilter('all')} className={`rounded px-3 py-1 ${filter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}>All</button>
          <button onClick={() => setFilter('new')} className={`rounded px-3 py-1 ${filter === 'new' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}>New</button>
        </div>
      </div>

      <div className="space-y-2">
        {shown.map((e) => (
          <div key={e.id} className={`rounded-xl border bg-white ${e.handled ? 'border-stone-200' : 'border-l-4 border-l-red-500 border-stone-200'}`}>
            <button
              onClick={() => setOpen(open === e.id ? null : e.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <span className={`text-sm ${e.handled ? 'font-medium text-stone-600' : 'font-semibold'}`}>{e.name}</span>
                <span className="ml-2 text-sm text-stone-400">{e.email}</span>
                {e.message && <p className="truncate text-sm text-stone-500">{e.message}</p>}
              </div>
              <span className="shrink-0 text-xs text-stone-400">{new Date(e.createdAt).toLocaleString('en-IN')}</span>
            </button>

            {open === e.id && (
              <div className="border-t border-stone-100 px-4 py-3 text-sm">
                <dl className="grid grid-cols-[90px_1fr] gap-y-1.5">
                  <dt className="text-stone-400">Email</dt>
                  <dd><a href={`mailto:${e.email}`} className="text-stone-800 hover:underline">{e.email}</a></dd>
                  {e.company && <><dt className="text-stone-400">Company</dt><dd>{e.company}</dd></>}
                  {e.phone && <><dt className="text-stone-400">Phone</dt><dd><a href={`tel:${e.phone}`} className="hover:underline">{e.phone}</a></dd></>}
                  <dt className="text-stone-400">Message</dt>
                  <dd className="whitespace-pre-wrap">{e.message || '—'}</dd>
                </dl>
                <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
                  <button onClick={() => toggleHandled(e)} className={e.handled ? 'btn-ghost' : 'btn-primary'}>
                    {e.handled ? 'Mark as new' : 'Mark handled'}
                  </button>
                  <a href={`mailto:${e.email}`} className="btn-ghost">Reply by email</a>
                  <button onClick={() => remove(e)} className="ml-auto text-sm text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!shown.length && (
          <p className="rounded-xl border border-dashed border-stone-300 py-12 text-center text-sm text-stone-400">
            {filter === 'new' ? 'No new enquiries.' : 'No enquiries yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
