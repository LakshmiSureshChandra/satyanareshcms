'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/admin-api'
import { Editor } from './Editor'

type Newsletter = {
  id: number
  subject: string
  body: string
  sentAt: string | null
  sentCount: number
  createdAt: string
}
type HistoryItem = { id: number; subject: string; sentAt: string | null; sentCount: number; createdAt: string }
type History = { items: HistoryItem[]; total: number; page: number; pages: number }

export function NewsletterSendForm({ id }: { id?: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(!!id)
  const [newsletterId, setNewsletterId] = useState<number | undefined>(id)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sentAt, setSentAt] = useState<string | null>(null)
  const [sentCount, setSentCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [savedNote, setSavedNote] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [history, setHistory] = useState<History | null>(null)

  const loadHistory = () => adminApi<History>('/admin/newsletter/history').then(setHistory)

  useEffect(() => {
    loadHistory()
    if (id) {
      adminApi<Newsletter>(`/admin/newsletter/${id}`).then((n) => {
        setSubject(n.subject)
        setBody(n.body)
        setSentAt(n.sentAt)
        setSentCount(n.sentCount)
        setLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const sent = !!sentAt

  async function saveDraft() {
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required'); return }
    setBusy(true)
    setError('')
    setSavedNote('')
    try {
      const n = newsletterId
        ? await adminApi<Newsletter>(`/admin/newsletter/${newsletterId}`, { method: 'PUT', body: { subject, body } })
        : await adminApi<Newsletter>('/admin/newsletter', { method: 'POST', body: { subject, body } })
      setNewsletterId(n.id)
      setSavedNote('Draft saved.')
      if (!id) router.replace(`/admin/newsletter/send/${n.id}`)
      loadHistory()
    } catch (e: any) {
      setError(e.message || 'Failed to save draft')
    }
    setBusy(false)
  }

  async function sendNow() {
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required'); return }
    if (!confirm('Send this to every active subscriber now? This cannot be undone.')) return
    setBusy(true)
    setError('')
    setSavedNote('')
    try {
      let nid = newsletterId
      if (!nid) {
        const n = await adminApi<Newsletter>('/admin/newsletter', { method: 'POST', body: { subject, body } })
        nid = n.id
        setNewsletterId(nid)
      } else {
        await adminApi<Newsletter>(`/admin/newsletter/${nid}`, { method: 'PUT', body: { subject, body } })
      }
      const result = await adminApi<Newsletter & { totalAttempted: number }>(`/admin/newsletter/${nid}/send`, { method: 'POST' })
      setSentAt(result.sentAt)
      setSentCount(result.sentCount)
      setSavedNote(`Sent to ${result.sentCount} of ${result.totalAttempted} active subscribers.`)
      loadHistory()
    } catch (e: any) {
      setError(e.message || 'Failed to send')
    }
    setBusy(false)
  }

  async function deleteDraft() {
    if (!newsletterId) return
    if (!confirm('Delete this draft?')) return
    await adminApi(`/admin/newsletter/${newsletterId}`, { method: 'DELETE' })
    router.push('/admin/newsletter/send')
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">{sent ? 'Newsletter' : 'Compose Newsletter'}</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin/newsletter/send" className="font-medium text-stone-600 hover:text-stone-900">+ New</Link>
          <Link href="/admin/newsletter" className="font-medium text-stone-600 hover:text-stone-900">← Subscribers</Link>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        {sent && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            Sent to {sentCount} subscriber{sentCount === 1 ? '' : 's'} on {new Date(sentAt!).toLocaleString()}.
            This is a permanent record and can no longer be edited.
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sent} className="admin-input w-full disabled:bg-stone-100" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Body</label>
          {sent ? (
            <div className="prose max-w-none rounded-md border border-stone-200 p-4" dangerouslySetInnerHTML={{ __html: body }} />
          ) : (
            <Editor value={body} onChange={setBody} />
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {savedNote && <p className="text-sm text-green-700">{savedNote}</p>}
        {!sent && (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={saveDraft} className="rounded-md border border-stone-300 px-5 py-2.5 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50">
              {busy ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="button" disabled={busy || !subject.trim() || !body.trim()} onClick={() => setPreview(true)} className="rounded-md border border-stone-300 px-5 py-2.5 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50">
              Preview
            </button>
            <button type="button" disabled={busy} onClick={sendNow} className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
              {busy ? 'Sending…' : 'Send to all active subscribers'}
            </button>
            {newsletterId && (
              <button type="button" disabled={busy} onClick={deleteDraft} className="ml-auto rounded-md px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                Delete Draft
              </button>
            )}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreview(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Preview — what subscribers will see</h2>
              <button onClick={() => setPreview(false)} className="text-stone-400 hover:text-stone-900">✕</button>
            </div>
            <p className="mb-3 border-b border-stone-200 pb-3 text-sm text-stone-500">Subject: <span className="font-medium text-stone-900">{subject}</span></p>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: body }} />
            <hr className="my-4" />
            <p className="text-xs text-stone-400">Unsubscribe from these emails.</p>
          </div>
        </div>
      )}

      {history && history.items.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-stone-600">All Newsletters</h2>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Sent</th>
                  <th className="px-3 py-3 text-right">Recipients</th>
                </tr>
              </thead>
              <tbody>
                {history.items.map((n) => (
                  <tr key={n.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/newsletter/send/${n.id}`} className="font-medium hover:underline">{n.subject}</Link>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${n.sentAt ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {n.sentAt ? 'Sent' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-stone-500">{n.sentAt ? new Date(n.sentAt).toLocaleString() : '—'}</td>
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
