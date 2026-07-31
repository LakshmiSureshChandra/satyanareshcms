'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'
import { NewsletterTabs } from './NewsletterTabs'

export function NewsletterSenderSettings() {
  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    adminApi<Record<string, string>>('/admin/settings').then((s) => {
      setFromEmail(s.newsletter_from_email || '')
      setFromName(s.newsletter_from_name || '')
      setLoading(false)
    })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setSaved(false)
    await adminApi('/admin/settings', {
      method: 'PUT',
      body: { newsletter_from_email: fromEmail, newsletter_from_name: fromName },
    })
    setBusy(false)
    setSaved(true)
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">Newsletter Sender</h1>

      <NewsletterTabs />

      {loading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <form onSubmit={save} className="max-w-md space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">
            This is who subscribers see as the sender — for both the subscription-confirmation email and every newsletter you send. Can be different from your login email.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">From Email</label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="contact@akganesh.in"
              className="admin-input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Display Name</label>
            <input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="AK Ganesh, Chartered Accountants"
              className="admin-input w-full"
            />
          </div>
          {saved && <p className="text-sm text-green-700">Saved.</p>}
          <button disabled={busy} className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </div>
  )
}
