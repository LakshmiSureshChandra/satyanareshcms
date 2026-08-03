'use client'

import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <div className="rounded-2xl border border-badge-border bg-badge-bg p-10 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent-dark text-on-accent">
          <Check className="size-6" />
        </div>
        <p className="headline text-xl">Thank you</p>
        <p className="mt-2 text-sm text-ink-2">
          Your message has been received. A chartered accountant will get back to you within one working day.
        </p>
      </div>
    )

  const field =
    'w-full rounded-xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink placeholder:text-ink-soft outline-none transition-colors focus:border-accent'
  const label = 'mb-1.5 block text-sm font-medium text-ink-2'

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-line bg-card p-6 md:grid-cols-2 md:p-8">
      <div>
        <label htmlFor="cf-name" className={label}>Name *</label>
        <input id="cf-name" name="name" required autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="cf-email" className={label}>Email *</label>
        <input id="cf-email" name="email" type="email" required autoComplete="email" className={field} />
      </div>
      <div>
        <label htmlFor="cf-company" className={label}>Company</label>
        <input id="cf-company" name="company" autoComplete="organization" className={field} />
      </div>
      <div>
        <label htmlFor="cf-phone" className={label}>Phone</label>
        <input id="cf-phone" name="phone" autoComplete="tel" className={field} />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="cf-message" className={label}>How can we help?</label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          maxLength={500}
          placeholder="Briefly describe your requirement — entity type, turnover, and what you need help with."
          className={field}
        />
      </div>
      {state === 'error' && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <Button type="submit" size="lg" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send message'}
          {state !== 'sending' && <ArrowRight />}
        </Button>
      </div>
    </form>
  )
}
