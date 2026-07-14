'use client'

import { useEffect, useState } from 'react'
import { adminApi, ApiError } from '@/lib/admin-api'

type User = { id: number; name: string; email: string; mobile: string | null; role: 'admin' | 'manager'; status: boolean; createdAt: string }

const EMPTY = { name: '', email: '', mobile: '', role: 'manager', status: true, password: '' }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const load = () => adminApi<User[]>('/admin/users').then(setUsers)
  useEffect(() => { load() }, [])

  function openEdit(u?: User) {
    setError('')
    if (u) {
      setEditing(u.id)
      setForm({ name: u.name, email: u.email, mobile: u.mobile || '', role: u.role, status: u.status, password: '' })
    } else {
      setEditing('new')
      setForm(EMPTY)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      await adminApi(editing === 'new' ? '/admin/users' : `/admin/users/${editing}`, {
        method: editing === 'new' ? 'POST' : 'PUT',
        body: { ...form, password: form.password || undefined },
      })
      setEditing(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
    }
  }

  async function remove(u: User) {
    if (!confirm(`Move staff member "${u.name}" to the recycle bin?`)) return
    try {
      await adminApi(`/admin/users/${u.id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Delete failed')
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Staff</h1>
        <button onClick={() => openEdit()} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          + New Staff
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Mobile</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-3 py-3 text-stone-500">{u.email}</td>
                <td className="px-3 py-3 text-stone-500">{u.mobile || '—'}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === 'admin' ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'}`}>{u.role}</span>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.status ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}>
                    {u.status ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(u)} className="mr-3 text-stone-600 hover:underline">Edit</button>
                  <button onClick={() => remove(u)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New' : 'Edit'} Staff</h2>
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label className="admin-label">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Mobile</label>
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} pattern="\d{10}" title="10 digits" className="admin-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="admin-input">
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Password {editing !== 'new' && <span className="font-normal text-stone-400">(blank = keep)</span>}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={editing === 'new'} minLength={8} className="admin-input" />
              </div>
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
