'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Subscribers', href: '/admin/newsletter' },
  { label: 'Compose', href: '/admin/newsletter/send' },
  { label: 'Drafts & Sent', href: '/admin/newsletter/history' },
]

export function NewsletterTabs() {
  const pathname = usePathname()
  return (
    <div className="mb-5 flex gap-1 border-b border-stone-200">
      {TABS.map((t) => {
        // /admin/newsletter/send/[id] is still part of the Compose tab
        const active = t.href === '/admin/newsletter'
          ? pathname === '/admin/newsletter'
          : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${active ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
