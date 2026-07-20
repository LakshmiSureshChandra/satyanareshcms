'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'

const TYPES = ['posts', 'pages', 'gallery', 'polls', 'users', 'banners'] as const
type TrashType = (typeof TYPES)[number]
const TYPE_LABELS: Record<TrashType, string> = { posts: 'Posts', pages: 'Pages', gallery: 'Gallery', polls: 'Polls', users: 'Users', banners: 'Sliders' }

export default function TrashPage() {
  const [type, setType] = useState<TrashType>('posts')
  const [items, setItems] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])

  const load = useCallback(() => {
    setSelected([])
    adminApi<any[]>(`/admin/trash/${type}`).then(setItems)
  }, [type])
  useEffect(() => { load() }, [load])

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function restore(ids: number[]) {
    await adminApi(`/admin/trash/${type}/restore`, { method: 'POST', body: { ids } })
    load()
  }

  async function destroy(ids: number[]) {
    if (!confirm(`Permanently delete ${ids.length} item(s)? This cannot be undone.`)) return
    await adminApi(`/admin/trash/${type}`, { method: 'DELETE', body: { ids } })
    load()
  }

  const label = (item: any) => item.title || item.name || item.email || `#${item.id}`

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">Trash</h1>

      <div className="mb-4 flex gap-1 border-b border-stone-200">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 text-sm font-medium ${type === t ? 'border-b-2 border-stone-900 text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-stone-200 px-4 py-2 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <button onClick={() => restore(selected)} className="ml-auto font-semibold text-green-700 hover:underline">Restore</button>
          <button onClick={() => destroy(selected)} className="font-semibold text-red-700 hover:underline">Delete forever</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="w-10 px-4 py-3">
                  <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} className="h-4 w-4 accent-stone-900" />
                </td>
                <td className="px-2 py-3 font-medium">{label(item)}</td>
                <td className="px-3 py-3 text-stone-500">deleted {new Date(item.deletedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => restore([item.id])} className="mr-3 text-green-700 hover:underline">Restore</button>
                  <button onClick={() => destroy([item.id])} className="text-red-600 hover:underline">Delete forever</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td className="px-4 py-10 text-center text-stone-400">Trash is empty.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
