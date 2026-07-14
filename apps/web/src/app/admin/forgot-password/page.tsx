'use client'

import { useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    const data = Object.fromEntries(new FormData(e.currentTarget))
    await adminApi('/auth/forgot', { method: 'POST', body: data }).catch(() => {})
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-stone-900">Forgot Password</h1>
        {sent ? (
          <p className="mt-4 text-sm text-stone-600">
            If that email exists, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="admin-label">Email</label>
              <input name="email" type="email" required autoFocus className="admin-input" />
            </div>
            <button disabled={busy} className="w-full rounded-md bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
              Send reset link
            </button>
          </form>
        )}
        <Link href="/admin/login" className="mt-4 block text-center text-sm text-stone-500 hover:text-stone-800">
          Back to login
        </Link>
      </div>
    </div>
  )
}
