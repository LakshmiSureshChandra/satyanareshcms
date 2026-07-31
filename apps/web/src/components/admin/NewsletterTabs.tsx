'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Subscribers', href: '/admin/newsletter' },
  { label: 'Compose', href: '/admin/newsletter/send' },
  { label: 'Drafts & Sent', href: '/admin/newsletter/history' },
]

// exact match, or a real sub-path (`+ '/'`) — plain startsWith would treat
// /admin/newsletter/sender as matching the Compose tab's href because the
// string "sender" starts with "send"
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NewsletterTabs() {
  const pathname = usePathname()
  const onSender = isActive(pathname, '/admin/newsletter/sender')
  return (
    <div className="mb-5 flex items-center justify-between border-b border-stone-200">
      <div className="flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${isActive(pathname, t.href) ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <Link
        href="/admin/newsletter/sender"
        className={`mb-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${onSender ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 01-2 1.2L14 21h-4l-.4-2.6a7 7 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 015 12a7 7 0 01.1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 012-1.2L10 3h4l.4 2.6a7 7 0 012 1.2l2.4-1 2 3.4-2 1.6c.1.4.2.8.2 1.2z" /></svg>
        Sender
      </Link>
    </div>
  )
}
