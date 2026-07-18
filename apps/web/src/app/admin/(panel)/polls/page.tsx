'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'

type PollOption = { id: number; text: string; votes: number }
type Poll = { id: number; title: string; status: boolean; createdAt: string; options: PollOption[] }

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])

  const load = () => adminApi<Poll[]>('/admin/polls').then(setPolls)
  useEffect(() => { load() }, [])

  async function remove(p: Poll) {
    if (!confirm(`Move "${p.title}" to trash?`)) return
    await adminApi(`/admin/polls/${p.id}`, { method: 'DELETE' })
    load()
  }

  async function archive(p: Poll) {
    if (!confirm(`Archive "${p.title}"? Visitors will no longer be able to vote on it.`)) return
    await adminApi(`/admin/polls/${p.id}/archive`, { method: 'PUT' })
    load()
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manage Polls</h1>
        <Link href="/admin/polls/new" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          + New Poll
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-3 py-3">Options</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {polls.map((p) => (
              <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {p.options.map((o) => (
                      <span key={o.id} className="rounded-md bg-stone-800 px-2 py-0.5 text-xs font-medium text-white">
                        {o.text} <span className="text-stone-300">({o.votes})</span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-stone-400">{p.options.reduce((s, o) => s + o.votes, 0)} total votes</p>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {p.status ? 'Published' : 'Archived'}
                  </span>
                </td>
                <td className="px-3 py-3 text-stone-500">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-right">
                  <a href={p.status ? '/' : `/polls/${p.id}`} target="_blank" rel="noreferrer" className="mr-3 text-stone-600 hover:underline">View</a>
                  {p.status ? (
                    <button onClick={() => archive(p)} className="mr-3 text-amber-700 hover:underline">Archive</button>
                  ) : (
                    <Link href={`/admin/polls/${p.id}/edit`} className="mr-3 text-stone-600 hover:underline">Edit</Link>
                  )}
                  <button onClick={() => remove(p)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!polls.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-400">No polls yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
