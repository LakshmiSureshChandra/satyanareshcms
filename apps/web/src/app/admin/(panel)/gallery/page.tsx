'use client'

import { useState } from 'react'
import { GalleryAlbumList } from '@/components/admin/GalleryAlbumList'
import { GalleryCategoryManager } from '@/components/admin/GalleryCategoryManager'

const TABS: { key: 'albums' | 'categories'; label: string }[] = [
  { key: 'albums', label: 'Albums' },
  { key: 'categories', label: 'Categories' },
]

export default function Page() {
  const [tab, setTab] = useState<'albums' | 'categories'>('albums')

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

      {tab === 'albums' ? <GalleryAlbumList /> : <GalleryCategoryManager />}
    </div>
  )
}
