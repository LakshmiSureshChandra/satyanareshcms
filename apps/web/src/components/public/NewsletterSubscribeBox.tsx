'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

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
      <p className="mb-3 text-sm leading-relaxed text-ink-2">
        Tax deadlines, regulatory changes, and practical guidance — occasionally, never spam.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          className="w-full rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft outline-none focus:border-accent"
        />
        <Button type="submit" disabled={busy} className="shrink-0">
          {busy ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </form>
      {message && <p className="mt-2.5 text-xs text-ink-soft">{message}</p>}
    </div>
  )
}
