'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'
import { NewsletterTabs } from './NewsletterTabs'

type HistoryItem = { id: number; subject: string; sentAt: string | null; sentCount: number; createdAt: string }
type History = { items: HistoryItem[]; total: number; page: number; pages: number }

export function NewsletterHistory() {
  const [history, setHistory] = useState<History | null>(null)

  useEffect(() => {
    adminApi<History>('/admin/newsletter/history').then(setHistory)
  }, [])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Drafts &amp; Sent Newsletters</h1>
        <Link href="/admin/newsletter/send" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          + New
        </Link>
      </div>

      <NewsletterTabs />

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
            {history?.items.map((n) => (
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
            {history && !history.items.length && (
              <tr><td colSpan={4} className="py-10 text-center text-stone-400">No newsletters yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
