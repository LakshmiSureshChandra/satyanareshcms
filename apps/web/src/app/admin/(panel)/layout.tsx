'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { adminApi } from '@/lib/admin-api'

type Me = { id: number; name: string; role: 'admin' | 'manager' }

const NAV: { label: string; href: string; adminOnly?: boolean; icon: string }[] = [
  { label: 'Dashboard', href: '/admin', icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
  { label: 'Posts', href: '/admin/posts', icon: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM7 7h10M7 11h10M7 15h6' },
  { label: 'Pages', href: '/admin/pages', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6' },
  { label: 'Staff', href: '/admin/users', adminOnly: true, icon: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8' },
  { label: 'Menus', href: '/admin/menus', adminOnly: true, icon: 'M4 6h16M4 12h16M4 18h10' },
  { label: 'Sliders', href: '/admin/banners', icon: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 15l5-5 4 4 3-3 6 6' },
  { label: 'Social Links', href: '/admin/social', adminOnly: true, icon: 'M18 8a3 3 0 10-2.83-4H15a3 3 0 000 6c.35 0 .68-.07 1-.18l-6.02 3.51a3 3 0 100 3.34L16 20.18A3 3 0 1015 17a3 3 0 00-1 .18l-6.02-3.51a3 3 0 000-3.34L14 6.82c.32.11.65.18 1 .18z' },
  { label: 'SEO', href: '/admin/seo', adminOnly: true, icon: 'M11 4a7 7 0 105.6 11.2l4.15 4.15a1 1 0 001.4-1.4l-4.14-4.15A7 7 0 0011 4zM6 11a5 5 0 1110 0 5 5 0 01-10 0z' },
  { label: 'Settings', href: '/admin/settings', adminOnly: true, icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 01-2 1.2L14 21h-4l-.4-2.6a7 7 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 015 12a7 7 0 01.1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 012-1.2L10 3h4l.4 2.6a7 7 0 012 1.2l2.4-1 2 3.4-2 1.6c.1.4.2.8.2 1.2z' },
  { label: 'Recycle Bin', href: '/admin/trash', adminOnly: true, icon: 'M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    adminApi<Me>('/auth/me').then(setMe).catch(() => {})
  }, [])

  async function logout() {
    await adminApi('/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/admin/login'
  }

  const nav = NAV.filter((n) => !n.adminOnly || me?.role === 'admin')

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* topbar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <button className="rounded p-1.5 hover:bg-stone-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <Link href="/admin" className="text-base font-bold">
            AK Ganesh <span className="rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">CMS</span>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="/" target="_blank" className="text-stone-500 hover:text-stone-900">View site ↗</a>
          <Link href="/admin/profile" className="font-medium hover:underline">{me?.name || '…'}</Link>
          <button onClick={logout} className="text-stone-500 hover:text-red-600">Logout</button>
        </div>
      </header>

      {/* sidebar */}
      <aside className={`fixed bottom-0 left-0 top-14 z-30 w-56 border-r border-stone-200 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="space-y-0.5 p-3">
          {nav.map((n) => {
            const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={n.icon} /></svg>
                {n.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="pt-14 lg:pl-56">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  )
}
