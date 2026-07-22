'use client'

import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    const res = await fetch(`${API}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => null)
    if (res?.ok) setState('sent')
    else {
      setError((await res?.json().catch(() => null))?.error || 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'sent')
    return (
      <div className="mt-8 rounded-md border border-line bg-paper-2 p-8 text-center">
        <p className="headline text-xl">Thank you!</p>
        <p className="mt-2 text-sm text-ink-soft">Your message has been received. We will get back to you soon.</p>
      </div>
    )

  const field = 'w-full rounded-md border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-accent'

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-semibold">Name *</label>
        <input name="name" required className={field} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Email *</label>
        <input name="email" type="email" required className={field} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Company</label>
        <input name="company" className={field} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Phone</label>
        <input name="phone" className={field} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-semibold">Message</label>
        <textarea name="message" rows={5} maxLength={500} className={field} />
      </div>
      {state === 'error' && <p className="text-sm text-red-700 md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <button
          disabled={state === 'sending'}
          className="rounded-md bg-accent px-10 py-3 font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {state === 'sending' ? 'Sending…' : 'Send Message'}
        </button>
      </div>
    </form>
  )
}
