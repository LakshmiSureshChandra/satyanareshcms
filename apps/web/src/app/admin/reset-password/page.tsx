'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { adminApi, ApiError } from '@/lib/admin-api'

function ResetForm() {
  const token = useSearchParams().get('token') || ''
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (fd.get('password') !== fd.get('confirm')) return setError('Passwords do not match')
    setBusy(true)
    try {
      await adminApi('/auth/reset', { method: 'POST', body: { token, password: fd.get('password') } })
      router.push('/admin/login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="admin-label">New password</label>
        <input name="password" type="password" required minLength={8} className="admin-input" />
      </div>
      <div>
        <label className="admin-label">Confirm password</label>
        <input name="confirm" type="password" required className="admin-input" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="w-full rounded-md bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
        Reset password
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-stone-900">Reset Password</h1>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
