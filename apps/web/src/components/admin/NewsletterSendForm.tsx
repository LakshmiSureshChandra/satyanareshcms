'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'
import { Editor } from './Editor'

type HistoryItem = { id: number; subject: string; sentAt: string | null; sentCount: number; createdAt: string }
type History = { items: HistoryItem[]; total: number; page: number; pages: number }

export function NewsletterSendForm() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState<History | null>(null)

  const loadHistory = () => adminApi<History>('/admin/newsletter/history').then(setHistory)

  useEffect(() => { loadHistory() }, [])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    if (!confirm('Send this to every active subscriber now? This cannot be undone.')) return
    setBusy(true)
    setError('')
    setResult('')
    try {
      const data = await adminApi<{ sent: number; total: number }>('/admin/newsletter/send', {
        method: 'POST',
        body: { subject, body },
      })
      setResult(`Sent to ${data.sent} of ${data.total} active subscribers.`)
      setSubject('')
      setBody('')
      loadHistory()
    } catch (e: any) {
      setError(e.message || 'Failed to send')
    }
    setBusy(false)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Compose &amp; Send Newsletter</h1>
        <Link href="/admin/newsletter" className="text-sm font-medium text-stone-600 hover:text-stone-900">← Subscribers</Link>
      </div>

      <form onSubmit={send} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="admin-input w-full" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Body</label>
          <Editor value={body} onChange={setBody} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && <p className="text-sm text-green-700">{result}</p>}
        <button disabled={busy} className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
          {busy ? 'Sending…' : 'Send to all active subscribers'}
        </button>
      </form>

      {history && history.items.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-stone-600">Send History</h2>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-3 py-3">Sent</th>
                  <th className="px-3 py-3 text-right">Recipients</th>
                </tr>
              </thead>
              <tbody>
                {history.items.map((n) => (
                  <tr key={n.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3">{n.subject}</td>
                    <td className="px-3 py-3 text-stone-500">{n.sentAt ? new Date(n.sentAt).toLocaleString() : 'Sending…'}</td>
                    <td className="px-3 py-3 text-right text-stone-500">{n.sentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
