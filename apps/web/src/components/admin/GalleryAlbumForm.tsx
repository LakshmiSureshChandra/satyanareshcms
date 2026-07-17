'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, apiOrigin, ApiError } from '@/lib/admin-api'
import { ImagePicker } from '@/components/admin/ImagePicker'

type Photo = { id: number; file: string }

export function GalleryAlbumForm({ id }: { id?: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', slug: '', coverImage: null as string | null,
    publishedAt: new Date().toISOString().slice(0, 16),
    status: false,
  })
  const [photos, setPhotos] = useState<Photo[]>([])

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const loadAlbum = () => {
    if (!id) return
    adminApi(`/admin/gallery/${id}`).then((a: any) => {
      setForm({
        title: a.title, slug: a.slug, coverImage: a.coverImage,
        publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : '',
        status: a.status,
      })
      setPhotos(a.photos)
      setLoading(false)
    })
  }
  useEffect(loadAlbum, [id])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = { ...form, removeCover: !form.coverImage }
      const saved: any = id
        ? await adminApi(`/admin/gallery/${id}`, { method: 'PUT', body })
        : await adminApi('/admin/gallery', { method: 'POST', body })
      if (!id) router.push(`/admin/gallery/${saved.id}/edit`)
      else router.push('/admin/gallery')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  async function uploadPhotos(files: FileList) {
    if (!id) return
    setPhotoBusy(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const photo = await adminApi(`/admin/gallery/${id}/photos`, { method: 'POST', formData: fd })
      setPhotos((p) => [...p, photo])
    }
    setPhotoBusy(false)
  }

  async function removePhoto(photoId: number) {
    if (!id) return
    setPhotos((p) => p.filter((ph) => ph.id !== photoId))
    await adminApi(`/admin/gallery/${id}/photos/${photoId}`, { method: 'DELETE' })
  }

  async function movePhoto(index: number, dir: -1 | 1) {
    if (!id) return
    const j = index + dir
    if (j < 0 || j >= photos.length) return
    const next = [...photos]
    ;[next[index], next[j]] = [next[j], next[index]]
    setPhotos(next)
    await adminApi(`/admin/gallery/${id}/photos/order`, { method: 'PUT', body: { ids: next.map((p) => p.id) } })
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>

  return (
    <div className="max-w-4xl">
      <form onSubmit={save}>
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-bold">{id ? 'Edit' : 'New'} Album</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.status} onChange={(e) => set({ status: e.target.checked })} className="h-4 w-4 accent-stone-900" />
              Published
            </label>
            <button disabled={busy} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="admin-label">Title *</label>
              <input value={form.title} onChange={(e) => set({ title: e.target.value })} required className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Slug <span className="font-normal text-stone-400">(auto if empty)</span></label>
              <input value={form.slug} onChange={(e) => set({ slug: e.target.value })} className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Publish Date &amp; Time</label>
              <input type="datetime-local" value={form.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} className="admin-input" />
            </div>
          </div>
          <ImagePicker label="Cover Image" value={form.coverImage} onChange={(coverImage) => set({ coverImage })} />
        </div>
      </form>

      {!id ? (
        <p className="mt-8 rounded-md bg-stone-100 px-4 py-3 text-sm text-stone-600">
          Save the album first, then come back here to add photos.
        </p>
      ) : (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">Photos ({photos.length})</h2>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoBusy}
              className="rounded-md border border-stone-300 px-4 py-1.5 text-sm font-semibold hover:bg-stone-100 disabled:opacity-50"
            >
              {photoBusy ? 'Uploading…' : '+ Add Photos'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => { if (e.target.files?.length) uploadPhotos(e.target.files); e.target.value = '' }}
            />
          </div>

          <p className="mb-3 text-xs text-stone-500">These appear one below the other on the album page, in this order.</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p, i) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${apiOrigin}${p.file}`} alt="" className="aspect-square w-full object-cover" />
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} className="rounded px-1.5 text-stone-400 hover:bg-stone-100 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === photos.length - 1} className="rounded px-1.5 text-stone-400 hover:bg-stone-100 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removePhoto(p.id)} className="ml-auto text-xs text-red-600 hover:underline">Remove</button>
                </div>
              </div>
            ))}
            {!photos.length && <p className="col-span-full py-8 text-center text-sm text-stone-400">No photos yet — add some above.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
