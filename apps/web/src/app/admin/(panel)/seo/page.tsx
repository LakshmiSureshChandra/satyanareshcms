'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'
import { ImagePicker } from '@/components/admin/ImagePicker'

export default function SeoPage() {
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi<Record<string, string>>('/admin/settings').then((s) => { setForm(s); setLoading(false) })
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await adminApi('/admin/settings', { method: 'PUT', body: form })
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>

  return (
    <form onSubmit={save} className="max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">SEO</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-700">Saved ✓</span>}
          <button disabled={busy} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save SEO Settings'}
          </button>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-stone-200 bg-white p-6">
        <div>
          <label className="admin-label">Default Meta Description <span className="font-normal text-stone-400">(used on the homepage and any page/post that doesn&apos;t set its own)</span></label>
          <textarea value={form.default_meta_description || ''} onChange={(e) => set('default_meta_description', e.target.value)} rows={2} maxLength={300} className="admin-input" />
        </div>

        <ImagePicker
          label="Default Social Share Image"
          value={form.og_image || null}
          onChange={(v) => set('og_image', v || '')}
        />
        <p className="-mt-4 text-xs text-stone-500">
          Shown when the site (or a post with no banner image) is shared on WhatsApp, Facebook, X, etc. Recommended size 1200×630.
        </p>

        <div>
          <label className="admin-label">Google Search Console Verification <span className="font-normal text-stone-400">(the content value of the meta tag Google gives you — not the whole tag)</span></label>
          <input value={form.google_site_verification || ''} onChange={(e) => set('google_site_verification', e.target.value)} placeholder="e.g. AbCdEf123..." className="admin-input" />
        </div>

        <div>
          <label className="admin-label">Google Analytics Snippet <span className="font-normal text-stone-400">(pasted as-is into the site, gated by cookie consent)</span></label>
          <textarea value={form.google_analytics || ''} onChange={(e) => set('google_analytics', e.target.value)} rows={4} className="admin-input font-mono text-xs" />
        </div>

        <div>
          <label className="admin-label">robots.txt</label>
          <textarea value={form.robot_txt || ''} onChange={(e) => set('robot_txt', e.target.value)} rows={4} className="admin-input font-mono text-xs" />
        </div>

        <p className="text-xs text-stone-500">
          Sitemap: <a href="/sitemap.xml" target="_blank" className="text-stone-700 underline">/sitemap.xml</a> is generated automatically from your published posts and pages — nothing to configure.
        </p>
      </div>
    </form>
  )
}
