'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Poll } from '@/lib/api'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

function Bar({ label, votes, total }: { label: string; votes: number; total: number }) {
  const pct = total > 0 ? Math.round((votes / total) * 100) : 0
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="min-w-0 truncate text-ink-2">{label}</span>
        <span className="shrink-0 font-semibold text-accent">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper-2">
        <div className="h-full rounded-full bg-accent-dark transition-all" style={{ width: `${pct}%` }} />
      </div>
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
    if (res.ok) {
      setPoll(data)
    } else if (res.status === 404) {
      // this poll stopped being the live one while the page sat open — refresh
      // to whatever's actually live now instead of leaving a stale, votable form
      const fresh = await fetch(`${API}/api/polls/active`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      setPoll(fresh)
      setError(fresh ? '' : 'This poll has closed.')
    } else {
      setError(data?.error || 'Something went wrong.')
    }
    setBusy(false)
  }

  if (!poll) return null

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Poll</p>
      <h3 className="mt-1.5 text-sm font-semibold leading-snug text-ink">{poll.title}</h3>

      {poll.closed && (
        <p className="mt-2 text-xs italic text-ink-soft">This poll is closed. You can only view the results.</p>
      )}

      {!poll.closed && !poll.hasVoted ? (
        <form onSubmit={vote} className="mt-3 space-y-1.5">
          {poll.options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-ink-2 hover:text-ink">
              <input
                type="radio"
                name="poll-option"
                checked={selected === o.id}
                onChange={() => setSelected(o.id)}
                className="size-3.5"
                style={{ accentColor: 'var(--color-accent-dark)' }}
              />
              {o.text}
            </label>
          ))}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={busy || !selected} className="mt-2 w-full">
            {busy ? 'Submitting…' : 'Submit vote'}
          </Button>
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
