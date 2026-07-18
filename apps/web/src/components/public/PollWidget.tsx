'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Poll } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

function Bar({ label, votes, total }: { label: string; votes: number; total: number }) {
  const pct = total > 0 ? Math.round((votes / total) * 100) : 0
  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 truncate text-ink-soft">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-semibold text-ink-soft">{pct}%</span>
    </div>
  )
}

export function PollWidget({ showArchiveLink = true }: { showArchiveLink?: boolean } = {}) {
  const [poll, setPoll] = useState<Poll | null | undefined>(undefined)
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/api/polls/active`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setPoll)
      .catch(() => setPoll(null))
  }, [])

  async function vote(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !poll) return
    setBusy(true)
    setError('')
    const res = await fetch(`${API}/api/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: selected }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok) setPoll(data)
    else setError(data?.error || 'Something went wrong.')
    setBusy(false)
  }

  if (!poll) return null

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Poll</p>
      <h3 className="mt-1 text-sm font-bold leading-snug">{poll.title}</h3>

      {!poll.hasVoted ? (
        <form onSubmit={vote} className="mt-3 space-y-1.5">
          {poll.options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="radio"
                name="poll-option"
                checked={selected === o.id}
                onChange={() => setSelected(o.id)}
                className="h-3.5 w-3.5"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              {o.text}
            </label>
          ))}
          {error && <p className="text-xs text-red-700">{error}</p>}
          <button
            disabled={busy || !selected}
            className="mt-2 w-full rounded-md bg-accent py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {busy ? 'Submitting…' : 'Submit Vote'}
          </button>
        </form>
      ) : (
        <div className="mt-3">
          <p className="mb-1 text-[11px] text-ink-soft">{poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'}</p>
          {poll.options.map((o) => (
            <Bar key={o.id} label={o.text} votes={o.votes} total={poll.totalVotes} />
          ))}
        </div>
      )}

      {showArchiveLink && (
        <Link href="/polls" className="mt-3 inline-block text-xs font-medium text-accent hover:underline">
          View previous polls →
        </Link>
      )}
    </div>
  )
}
