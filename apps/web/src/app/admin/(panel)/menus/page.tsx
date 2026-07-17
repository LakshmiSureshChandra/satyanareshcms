'use client'

import { useState } from 'react'
import { MenuBuilder } from '@/components/admin/MenuBuilder'

const TABS: { key: 'header' | 'footer'; label: string }[] = [
  { key: 'header', label: 'Header Menu' },
  { key: 'footer', label: 'Footer' },
]

export default function MenusPage() {
  const [tab, setTab] = useState<'header' | 'footer'>('header')

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

      {tab === 'header' ? (
        <MenuBuilder key="header" location="header" title="Header Menu" saveLabel="Save Menu" />
      ) : (
        <MenuBuilder key="footer" location="footer" title="Footer" saveLabel="Save Footer" />
      )}
    </div>
  )
}
