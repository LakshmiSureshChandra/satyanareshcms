'use client'

import { useState } from 'react'
import Link from 'next/link'
import { adminApi, ApiError } from '@/lib/admin-api'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    try {
      await adminApi('/auth/login', { method: 'POST', body: data })
      window.location.href = '/admin'
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-stone-900">Admin Login</h1>
        <p className="mt-1 text-sm text-stone-500">Sign in to manage your site</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="admin-label">Email</label>
            <input name="email" type="email" required autoFocus className="admin-input" />
          </div>
          <div>
            <label className="admin-label">Password</label>
            <input name="password" type="password" required className="admin-input" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-md bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <Link href="/admin/forgot-password" className="mt-4 block text-center text-sm text-stone-500 hover:text-stone-800">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
