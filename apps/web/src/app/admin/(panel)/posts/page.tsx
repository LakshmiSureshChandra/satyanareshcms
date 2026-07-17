'use client'

import { useState } from 'react'
import { PostListPage } from '@/components/admin/PostListPage'
import { CategoryManager } from '@/components/admin/CategoryManager'

const TABS: { key: 'posts' | 'categories'; label: string }[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'categories', label: 'Categories' },
]

export default function Page() {
  const [tab, setTab] = useState<'posts' | 'categories'>('posts')

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-stone-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold ${tab === t.key ? 'border-b-2 border-stone-900 text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'posts' ? <PostListPage kind="post" /> : <CategoryManager />}
    </div>
  )
}
