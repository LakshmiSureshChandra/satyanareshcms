'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'

type Stats = {
  posts: number
  pages: number
  categories: number
  users: number
  totalViews: number
  recent: { id: number; title: string; status: boolean; views: number; publishedAt: string | null; createdAt: string }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    adminApi<Stats>('/admin/dashboard-stats').then(setStats).catch(() => {})
  }, [])

  const cards = stats
    ? [
        ['Posts', stats.posts, '/admin/posts'],
        ['Pages', stats.pages, '/admin/pages'],
        ['Categories', stats.categories, '/admin/categories'],
        ['Staff', stats.users, '/admin/users'],
        ['Total Views', stats.totalViews.toLocaleString(), null],
      ]
    : []

  return (
    <div>
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
        {cards.map(([label, value, href]) => {
          const inner = (
            <div className="rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          )
          return href ? <Link key={String(label)} href={String(href)}>{inner}</Link> : <div key={String(label)}>{inner}</div>
        })}
        {!stats && <p className="col-span-full text-sm text-stone-500">Loading…</p>}
      </div>

      {stats && (
        <div className="mt-8 rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
            <h2 className="text-sm font-semibold">Recent Posts</h2>
            <Link href="/admin/posts/new" className="text-sm font-medium text-stone-600 hover:text-stone-900">+ New Post</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {stats.recent.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-5 py-2.5">
                    <Link href={`/admin/posts/${p.id}/edit`} className="font-medium hover:underline">{p.title}</Link>
                  </td>
                  <td className="px-3 py-2.5 text-right text-stone-500">{p.views} views</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {p.status ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
