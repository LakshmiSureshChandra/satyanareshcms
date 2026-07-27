'use client'

import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export function NewsletterSubscribeBox() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const res = await fetch(`${API}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok) {
      setMessage(data?.alreadySubscribed ? "You're already subscribed." : 'Check your inbox to confirm your subscription.')
      setEmail('')
    } else {
      setMessage(data?.error || 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  return (
    <div>
      <p className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-paper/40">Newsletter</p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full max-w-[220px] rounded-md border border-paper/20 bg-paper/10 px-3 py-2 text-sm text-paper placeholder:text-paper/40 focus:border-gold focus:outline-none"
        />
        <button disabled={busy} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
          {busy ? '…' : 'Subscribe'}
        </button>
      </form>
      {message && <p className="mt-2 text-xs text-paper/60">{message}</p>}
    </div>
  )
}
