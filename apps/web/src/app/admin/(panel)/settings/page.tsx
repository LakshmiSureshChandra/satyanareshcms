'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'
import { ImagePicker } from '@/components/admin/ImagePicker'

type Cat = { id: number; name: string }

const TEXT_FIELDS: [string, string][] = [
  ['site_name', 'Site Name'],
  ['site_email', 'Site Email'],
  ['site_phone', 'Site Phone'],
  ['facebook_link', 'Facebook URL'],
  ['twitter_link', 'X / Twitter URL'],
  ['instagram_link', 'Instagram URL'],
  ['youtube_link', 'YouTube URL'],
  ['linkedin_link', 'LinkedIn URL'],
  ['copy_rights_info', 'Copyright Line'],
]

export default function SettingsPage() {
  const [form, setForm] = useState<Record<string, string>>({})
  const [cats, setCats] = useState<Cat[]>([])
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi<Record<string, string>>('/admin/settings').then(setForm)
    adminApi<Cat[]>('/admin/categories').then(setCats)
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

  return (
    <form onSubmit={save} className="max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Settings</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-700">Saved ✓</span>}
          <button disabled={busy} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-stone-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {TEXT_FIELDS.map(([key, label]) => (
            <div key={key} className={key === 'copy_rights_info' ? 'md:col-span-2' : ''}>
              <label className="admin-label">{label}</label>
              <input value={form[key] || ''} onChange={(e) => set(key, e.target.value)} className="admin-input" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ImagePicker label="Site Logo" value={form.site_logo || null} onChange={(v) => set('site_logo', v || '')} />
          <ImagePicker label="Favicon" value={form.fav_icon || null} onChange={(v) => set('fav_icon', v || '')} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="admin-label">Homepage Hero Category</label>
            <select value={form.home_hero_category_id || ''} onChange={(e) => set('home_hero_category_id', e.target.value)} className="admin-input">
              <option value="">— Latest from all —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="admin-label">Homepage Featured Category</label>
            <select value={form.home_featured_category_id || ''} onChange={(e) => set('home_featured_category_id', e.target.value)} className="admin-input">
              <option value="">— Latest from all —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="admin-label">Google Analytics snippet <span className="font-normal text-stone-400">(pasted as-is into the site, gated by cookie consent)</span></label>
          <textarea value={form.google_analytics || ''} onChange={(e) => set('google_analytics', e.target.value)} rows={4} className="admin-input font-mono text-xs" />
        </div>

        <div>
          <label className="admin-label">robots.txt</label>
          <textarea value={form.robot_txt || ''} onChange={(e) => set('robot_txt', e.target.value)} rows={3} className="admin-input font-mono text-xs" />
        </div>
      </div>
    </form>
  )
}
