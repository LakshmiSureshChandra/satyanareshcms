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

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Homepage Banners</h1>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
          {busy ? 'Uploading…' : '+ Upload Banner'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${apiOrigin}${b.file}`} alt={b.name} className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="truncate text-stone-600">{b.name}</span>
              <button onClick={() => remove(b)} className="ml-2 shrink-0 text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {!banners.length && <p className="col-span-full py-10 text-center text-sm text-stone-400">No banners uploaded.</p>}
      </div>
    </div>
  )
}
