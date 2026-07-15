'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MenuItem, Settings } from '@/lib/api'
import { SocialIcons } from './SocialIcons'

function MenuLink({ item, className, style, onClick }: { item: MenuItem; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <Link
      href={item.url}
      target={item.newWindow ? '_blank' : undefined}
      className={className}
      style={style}
      onClick={onClick}
    >
      {item.title}
    </Link>
  )
}

function DesktopItem({ item }: { item: MenuItem }) {
  if (!item.children.length)
    return (
      <MenuLink
        item={item}
        className="rounded-full px-4 py-2 text-[15px] font-semibold transition-colors hover:bg-ink hover:text-paper"
      />
    )
  return (
    <div className="group relative">
      <MenuLink
        item={item}
        className="flex items-center gap-1 rounded-full px-4 py-2 text-[15px] font-semibold transition-colors hover:bg-ink hover:text-paper after:content-['▾'] after:text-[10px] after:opacity-60"
      />
      <div className="invisible absolute left-0 top-full z-40 min-w-56 rounded-2xl border border-line bg-paper p-1.5 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
        {item.children.map((c) => {
          const hasKids = c.children.length > 0
          return (
            <div key={c.id} className="group/sub relative">
              <MenuLink
                item={c}
                className={`flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-paper-2 hover:text-accent ${hasKids ? "after:content-['›'] after:text-ink-soft" : ''}`}
              />
              {hasKids && (
                // pl-1 bridges the hover gap so the flyout doesn't close mid-travel
                <div className="invisible absolute left-full top-0 z-50 min-w-48 pl-1 opacity-0 transition-all group-hover/sub:visible group-hover/sub:opacity-100">
                  <div className="rounded-2xl border border-line bg-paper p-1.5 shadow-xl">
                    {c.children.map((g) => (
                      <MenuLink
                        key={g.id}
                        item={g}
                        className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-paper-2 hover:text-accent"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MobileItem({ item, depth, close }: { item: MenuItem; depth: number; close: () => void }) {
  return (
    <>
      <MenuLink
        item={item}
        onClick={close}
        className={`block border-b border-line py-3 ${depth === 0 ? 'headline text-2xl' : 'text-base text-ink-soft'}`}
        style={depth > 0 ? { paddingLeft: depth * 18 } : undefined}
      />
      {item.children.map((c) => (
        <MobileItem key={c.id} item={c} depth={depth + 1} close={close} />
      ))}
    </>
  )
}

export function Header({ menus, settings, logoUrl }: { menus: MenuItem[]; settings: Settings; logoUrl: string | null }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const router = useRouter()

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      router.push(`/search?s=${encodeURIComponent(q.trim())}`)
      setSearchOpen(false)
      setOpen(false)
    }
  }

  return (
    <>
      {/* top strip */}
      <div className="border-b border-line bg-paper-2/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-xs font-medium text-ink-soft">
          <span suppressHydrationWarning>
            {new Date().toLocaleDateString('te-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <SocialIcons settings={settings} className="h-4 w-4" />
        </div>
      </div>

      {/* sticky glass bar: logo + nav + actions in one row */}
      <header className="glass sticky top-0 z-50 border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5">
          <button
            className="rounded-full p-2 hover:bg-paper-2 md:hidden"
            onClick={() => { setOpen(!open); setSearchOpen(false) }}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 7h18M3 12h12M3 17h18" />}
            </svg>
          </button>

          <Link href="/" className="mr-2 flex items-center" onClick={() => setOpen(false)}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={settings.site_name} className="h-10 w-auto md:h-11" />
            ) : (
              <span className="headline text-2xl md:text-[1.7rem]">
                {settings.site_name || 'AK Ganesh'}
                <span className="text-accent">.</span>
              </span>
            )}
          </Link>

          <nav className="hidden flex-1 items-center md:flex">
            {menus.map((m) => (
              <DesktopItem key={m.id} item={m} />
            ))}
          </nav>

          <button
            className="ml-auto rounded-full bg-ink p-2.5 text-paper transition-transform hover:scale-105 md:ml-0"
            onClick={() => { setSearchOpen(!searchOpen); setOpen(false) }}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
        </div>

        {/* search drawer */}
        {searchOpen && (
          <div className="border-t border-line">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="వార్తలు వెతకండి…"
                className="w-full rounded-full border border-line bg-white/70 px-5 py-2.5 outline-none focus:border-accent"
              />
              <button className="rounded-full bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-dark">
                వెతకండి
              </button>
            </form>
          </div>
        )}

        {/* mobile overlay menu */}
        {open && (
          <div className="border-t border-line px-5 pb-8 pt-2 md:hidden">
            {menus.map((m) => (
              <MobileItem key={m.id} item={m} depth={0} close={() => setOpen(false)} />
            ))}
            <div className="mt-6">
              <SocialIcons settings={settings} />
            </div>
          </div>
        )}
      </header>
    </>
  )
}
