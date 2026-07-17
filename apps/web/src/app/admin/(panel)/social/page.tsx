'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'

const FIELDS: [string, string, string][] = [
  ['facebook_link', 'Facebook', 'https://facebook.com/yourpage'],
  ['twitter_link', 'X / Twitter', 'https://x.com/yourhandle'],
  ['instagram_link', 'Instagram', 'https://instagram.com/yourhandle'],
  ['youtube_link', 'YouTube', 'https://youtube.com/@yourchannel'],
  ['linkedin_link', 'LinkedIn', 'https://linkedin.com/company/yourpage'],
]

export default function SocialLinksPage() {
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
    // only send the social fields — never clobber other settings with a stale form
    const body = Object.fromEntries(FIELDS.map(([key]) => [key, form[key] || '']))
    await adminApi('/admin/settings', { method: 'PUT', body })
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>

  return (
    <form onSubmit={save} className="max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Social Links</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-700">Saved ✓</span>}
          <button disabled={busy} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save Social Links'}
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-stone-500">
        These appear as icons in the header and footer. Leave a field blank to hide that icon. The full <code>https://</code> address isn&apos;t required — a plain address like <code>facebook.com/yourpage</code> works too.
      </p>

      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
        {FIELDS.map(([key, label, placeholder]) => (
          <div key={key}>
            <label className="admin-label">{label}</label>
            <input value={form[key] || ''} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} className="admin-input" />
          </div>
        ))}
      </div>
    </form>
  )
}
