'use client'

import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export function NewsletterTokenAction({
  token,
  action,
  buttonLabel,
  successMessage,
}: {
  token: string
  action: 'confirm' | 'unsubscribe'
  buttonLabel: string
  successMessage: string
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function run() {
    setState('busy')
    const res = await fetch(`${API}/api/newsletter/${action}/${token}`, { method: 'POST' })
    if (res.ok) {
      setState('done')
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error || 'Something went wrong.')
      setState('error')
    }
  }

  if (state === 'done') return <p className="text-sm text-ink-soft">{successMessage}</p>
  if (state === 'error') return <p className="text-sm text-red-700">{error}</p>

  return (
    <button
      onClick={run}
      disabled={state === 'busy'}
      className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
    >
      {state === 'busy' ? 'Please wait…' : buttonLabel}
    </button>
  )
}
