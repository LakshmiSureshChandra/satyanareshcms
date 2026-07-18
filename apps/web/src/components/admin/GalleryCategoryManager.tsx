'use client'

import { useEffect, useState } from 'react'
import { adminApi, ApiError } from '@/lib/admin-api'

type Cat = { id: number; name: string; slug: string; status: boolean; albumCount: number }

const EMPTY = { name: '', status: true }

export function GalleryCategoryManager() {
  const [cats, setCats] = useState<Cat[]>([])
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const load = () => adminApi<Cat[]>('/admin/gallery/categories').then(setCats)
  useEffect(() => { load() }, [])

  function openEdit(c?: Cat) {
    setError('')
    if (c) { setEditing(c.id); setForm({ name: c.name, status: c.status }) }
    else { setEditing('new'); setForm(EMPTY) }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      await adminApi(editing === 'new' ? '/admin/gallery/categories' : `/admin/gallery/categories/${editing}`, {
        method: editing === 'new' ? 'POST' : 'PUT',
        body: form,
      })
      setEditing(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
    }
  }

  async function remove(c: Cat) {
    if (!confirm(`Delete category "${c.name}"? Its albums will not be deleted, just uncategorized.`)) return
    await adminApi(`/admin/gallery/categories/${c.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Gallery Categories</h1>
        <button onClick={() => openEdit()} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          + New Category
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3 text-right">Albums</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-3 py-3 text-stone-500">{c.slug}</td>
                <td className="px-3 py-3 text-right text-stone-500">{c.albumCount}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}>
                    {c.status ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="mr-3 text-stone-600 hover:underline">Edit</button>
                  <button onClick={() => remove(c)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!cats.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-400">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New' : 'Edit'} Category</h2>
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label className="admin-label">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="admin-input" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} className="h-4 w-4 accent-stone-900" />
              Active
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">Cancel</button>
              <button className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
