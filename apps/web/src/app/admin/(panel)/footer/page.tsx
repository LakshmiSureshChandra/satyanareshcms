'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'

type FLink = { label: string; url: string }
type Column = { title: string; links: FLink[] }
type Config = { about: string; columns: Column[] }

const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}

export default function FooterPage() {
  const [config, setConfig] = useState<Config>({ about: '', columns: [] })
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi<Record<string, string>>('/admin/settings').then((s) => {
      try {
        const parsed = s.footer_config ? JSON.parse(s.footer_config) : null
        setConfig({ about: parsed?.about || '', columns: parsed?.columns || [] })
      } catch {
        setConfig({ about: '', columns: [] })
      }
      setLoading(false)
    })
  }, [])

  const setCol = (ci: number, patch: Partial<Column>) =>
    setConfig((c) => ({ ...c, columns: c.columns.map((col, i) => (i === ci ? { ...col, ...patch } : col)) }))
  const setLink = (ci: number, li: number, patch: Partial<FLink>) =>
    setCol(ci, { links: config.columns[ci].links.map((l, i) => (i === li ? { ...l, ...patch } : l)) })

  async function save() {
    setBusy(true)
    await adminApi('/admin/settings', { method: 'PUT', body: { footer_config: JSON.stringify(config) } })
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>

  return (
    <div className="max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Footer</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-700">Saved ✓</span>}
          <button onClick={save} disabled={busy} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save Footer'}
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-stone-200 bg-white p-5">
        <label className="admin-label">About text <span className="font-normal text-stone-400">(short blurb under the site name)</span></label>
        <textarea value={config.about} onChange={(e) => setConfig({ ...config, about: e.target.value })} rows={2} className="admin-input" placeholder="Leave blank for the default." />
      </div>

      <p className="mb-3 text-xs text-stone-500">
        Add columns of links. Each link&apos;s URL can be internal (e.g. <code>/page/about-us</code>, <code>/category/business</code>, <code>/contact</code>) or a full external address.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {config.columns.map((col, ci) => (
          <div key={ci} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <input
                value={col.title}
                onChange={(e) => setCol(ci, { title: e.target.value })}
                placeholder="Column heading"
                className="admin-input font-semibold"
              />
              <button onClick={() => setConfig((c) => ({ ...c, columns: move(c.columns, ci, -1) }))} className="rounded px-1.5 text-stone-400 hover:bg-stone-100" title="Move column up">↑</button>
              <button onClick={() => setConfig((c) => ({ ...c, columns: move(c.columns, ci, 1) }))} className="rounded px-1.5 text-stone-400 hover:bg-stone-100" title="Move column down">↓</button>
              <button onClick={() => setConfig((c) => ({ ...c, columns: c.columns.filter((_, i) => i !== ci) }))} className="rounded px-1.5 text-red-500 hover:bg-red-50" title="Delete column">✕</button>
            </div>

            <div className="space-y-2">
              {col.links.map((link, li) => (
                <div key={li} className="flex items-center gap-1.5">
                  <input value={link.label} onChange={(e) => setLink(ci, li, { label: e.target.value })} placeholder="Label" className="admin-input" />
                  <input value={link.url} onChange={(e) => setLink(ci, li, { url: e.target.value })} placeholder="/page/... or https://" className="admin-input" />
                  <button onClick={() => setCol(ci, { links: move(col.links, li, -1) })} className="rounded px-1 text-stone-400 hover:bg-stone-100" title="Up">↑</button>
                  <button onClick={() => setCol(ci, { links: move(col.links, li, 1) })} className="rounded px-1 text-stone-400 hover:bg-stone-100" title="Down">↓</button>
                  <button onClick={() => setCol(ci, { links: col.links.filter((_, i) => i !== li) })} className="rounded px-1 text-red-500 hover:bg-red-50" title="Remove">✕</button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCol(ci, { links: [...col.links, { label: '', url: '' }] })}
              className="w-full rounded-md border border-dashed border-stone-300 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-50"
            >
              + Add link
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setConfig((c) => ({ ...c, columns: [...c.columns, { title: 'New Column', links: [] }] }))}
        className="mt-4 rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-100"
      >
        + Add column
      </button>

      {!config.columns.length && (
        <p className="mt-3 text-sm text-stone-400">No columns yet — the site shows the default footer (Categories + Information) until you add some.</p>
      )}
    </div>
  )
}
