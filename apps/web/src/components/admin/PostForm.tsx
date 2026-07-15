'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, ApiError } from '@/lib/admin-api'
import { Editor } from './Editor'
import { ImagePicker } from './ImagePicker'

type Cat = { id: number; name: string; parentId: number | null }

// One form for posts and pages; `kind` toggles the post-only fields.
export function PostForm({ kind, id }: { kind: 'post' | 'page'; id?: number }) {
  const router = useRouter()
  const base = kind === 'post' ? '/admin/posts' : '/admin/pages'
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cats, setCats] = useState<Cat[]>([])

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    bannerImage: null as string | null,
    tags: '',
    sortOrder: 0,
    publishedAt: new Date().toISOString().slice(0, 16),
    metaTitle: '',
    metaDescription: '',
    status: false,
    categoryIds: [] as number[],
  })

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    if (kind === 'post') adminApi<Cat[]>('/admin/categories').then(setCats)
    if (id) {
      adminApi(`/admin${base.replace('/admin', '')}/${id}`).then((p: any) => {
        setForm({
          title: p.title,
          slug: p.slug,
          content: p.content,
          bannerImage: p.bannerImage,
          tags: p.tags || '',
          sortOrder: p.sortOrder,
          publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 16) : '',
          metaTitle: p.metaTitle || '',
          metaDescription: p.metaDescription || '',
          status: p.status,
          categoryIds: p.categoryIds || [],
        })
        setLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const apiBase = kind === 'post' ? '/admin/posts' : '/admin/pages'
      await adminApi(id ? `${apiBase}/${id}` : apiBase, {
        method: id ? 'PUT' : 'POST',
        body: { ...form, removeBanner: !form.bannerImage },
      })
      router.push(base)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
      setBusy(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>

  return (
    <form onSubmit={save}>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {id ? 'Edit' : 'New'} {kind === 'post' ? 'Post' : 'Page'}
        </h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.status}
              onChange={(e) => set({ status: e.target.checked })}
              className="h-4 w-4 accent-stone-900"
            />
            Published
          </label>
          <button disabled={busy} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* main column */}
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label className="admin-label">Title *</label>
            <input value={form.title} onChange={(e) => set({ title: e.target.value })} required className="admin-input text-base" />
          </div>
          <div>
            <label className="admin-label">Content *</label>
            <Editor value={form.content} onChange={(content) => set({ content })} />
          </div>
          {kind === 'post' && (
            <div>
              <label className="admin-label">Tags <span className="font-normal text-stone-400">(comma separated)</span></label>
              <input value={form.tags} onChange={(e) => set({ tags: e.target.value })} className="admin-input" placeholder="news, business" />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-label">Meta Title</label>
              <input value={form.metaTitle} onChange={(e) => set({ metaTitle: e.target.value })} className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Meta Description</label>
              <input value={form.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} className="admin-input" />
            </div>
          </div>
        </div>

        {/* side column */}
        <div className="space-y-4">
          <div>
            <label className="admin-label">Publish Date</label>
            <input
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) => set({ publishedAt: e.target.value })}
              className="admin-input"
              required={kind === 'post'}
            />
          </div>
          <div>
            <label className="admin-label">Slug <span className="font-normal text-stone-400">(auto if empty)</span></label>
            <input value={form.slug} onChange={(e) => set({ slug: e.target.value })} className="admin-input" />
          </div>
          {kind === 'post' && (
            <div>
              <label className="admin-label">Categories *</label>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-stone-300 bg-white p-3">
                {cats.map((c) => (
                  <label key={c.id} className={`flex items-center gap-2 text-sm ${c.parentId ? 'ml-4' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(c.id)}
                      onChange={(e) =>
                        set({
                          categoryIds: e.target.checked
                            ? [...form.categoryIds, c.id]
                            : form.categoryIds.filter((x) => x !== c.id),
                        })
                      }
                      className="h-4 w-4 accent-stone-900"
                    />
                    {c.name}
                  </label>
                ))}
                {!cats.length && <p className="text-xs text-stone-400">No categories yet.</p>}
              </div>
            </div>
          )}
          <ImagePicker value={form.bannerImage} onChange={(bannerImage) => set({ bannerImage })} />
          <div>
            <label className="admin-label">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} className="admin-input" />
          </div>
        </div>
      </div>
    </form>
  )
}
