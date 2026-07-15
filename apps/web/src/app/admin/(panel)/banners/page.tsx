'use client'

import { useEffect, useRef, useState } from 'react'
import { adminApi, apiOrigin } from '@/lib/admin-api'

type Banner = { id: number; name: string; file: string }

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => adminApi<Banner[]>('/admin/banners').then(setBanners)
  useEffect(() => { load() }, [])

  async function upload(file: File) {
    setBusy(true)
    const fd = new FormData()
    fd.append('file', file)
    await adminApi('/admin/banners', { method: 'POST', formData: fd })
    setBusy(false)
    load()
  }

  async function remove(b: Banner) {
    if (!confirm(`Delete banner "${b.name}"?`)) return
    await adminApi(`/admin/banners/${b.id}`, { method: 'DELETE' })
    load()
  }

  // reorder locally, then persist the new order
  async function move(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= banners.length) return
    const next = [...banners]
    ;[next[index], next[j]] = [next[j], next[index]]
    setBanners(next)
    await adminApi('/admin/banners/order', { method: 'PUT', body: { ids: next.map((b) => b.id) } })
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Homepage Banners</h1>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
          {busy ? 'Uploading…' : '+ Upload Banner'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
      </div>

      {banners.length > 1 && <p className="mb-3 text-xs text-stone-500">Use the arrows to set the order banners appear on the homepage.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b, i) => (
          <div key={b.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${apiOrigin}${b.file}`} alt={b.name} className="aspect-video w-full object-cover" />
            <div className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="truncate text-stone-600">{b.name}</span>
              <div className="ml-auto flex shrink-0 items-center gap-1 text-stone-400">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1.5 hover:bg-stone-100 disabled:opacity-30" title="Move up">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === banners.length - 1} className="rounded px-1.5 hover:bg-stone-100 disabled:opacity-30" title="Move down">↓</button>
                <button onClick={() => remove(b)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!banners.length && <p className="col-span-full py-10 text-center text-sm text-stone-400">No banners uploaded.</p>}
      </div>
    </div>
  )
}
