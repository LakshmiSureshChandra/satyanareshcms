'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, ApiError } from '@/lib/admin-api'

export function PollForm({ id }: { id?: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)

  const [title, setTitle] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [status, setStatus] = useState(false)

  useEffect(() => {
    if (!id) return
    adminApi(`/admin/polls/${id}`).then((p: any) => {
      setTitle(p.title)
      setOptions(p.options.map((o: any) => o.text))
      setStatus(p.status)
      setLocked(p.status)
      setLoading(false)
    })
  }, [id])

  function setOption(i: number, value: string) {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? value : o)))
  }
  function addOption() {
    setOptions((opts) => [...opts, ''])
  }
  function removeOption(i: number) {
    setOptions((opts) => opts.filter((_, idx) => idx !== i))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = { title, options: options.map((o) => o.trim()).filter(Boolean), status }
      if (id) await adminApi(`/admin/polls/${id}`, { method: 'PUT', body })
      else await adminApi('/admin/polls', { method: 'POST', body })
      router.push('/admin/polls')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-xl font-bold">{id ? 'Edit' : 'Create'} Poll</h1>

      {locked && (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          This poll is currently live and being voted on — archive it (publish a different poll) before editing.
        </p>
      )}
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <fieldset disabled={locked} className="space-y-5 disabled:opacity-50">
        <form onSubmit={save} className="space-y-5">
          <div>
            <label className="admin-label">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="admin-input" />
          </div>

          <div>
            <label className="admin-label">Options (Add at least 2)</label>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input value={o} onChange={(e) => setOption(i, e.target.value)} className="admin-input" />
                  <button type="button" onClick={() => removeOption(i)} className="shrink-0 rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addOption} className="mt-3 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              + Add Option
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} className="h-4 w-4 accent-stone-900" />
            Published — makes this the one active poll visitors can vote on (any currently active poll moves to Archived)
          </label>

          <button disabled={busy} className="rounded-md bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      </fieldset>
    </div>
  )
}
