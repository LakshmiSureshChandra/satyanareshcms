'use client'

import { useEffect, useState } from 'react'
import { adminApi, ApiError } from '@/lib/admin-api'

export default function ProfilePage() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi('/auth/me').then((me: any) => setForm((f) => ({ ...f, name: me.name, email: me.email })))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await adminApi('/auth/profile', { method: 'PUT', body: { ...form, password: form.password || undefined } })
      setMsg({ ok: true, text: 'Profile updated.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Update failed' })
    }
    setBusy(false)
  }

  return (
    <form onSubmit={save} className="max-w-md">
      <h1 className="mb-5 text-xl font-bold">My Profile</h1>
      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
        {msg && (
          <p className={`rounded px-3 py-2 text-sm ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>
        )}
        <div>
          <label className="admin-label">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="admin-input" />
        </div>
        <div>
          <label className="admin-label">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="admin-input" />
        </div>
        <div>
          <label className="admin-label">Mobile</label>
          <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} pattern="\d{10}" title="10 digits" className="admin-input" />
        </div>
        <div>
          <label className="admin-label">New Password <span className="font-normal text-stone-400">(blank = keep current)</span></label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} className="admin-input" />
        </div>
        <button disabled={busy} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
          {busy ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}
