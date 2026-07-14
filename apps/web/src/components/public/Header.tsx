'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MenuItem, Settings } from '@/lib/api'
import { SocialIcons } from './SocialIcons'

function MenuLink({ item, className, style }: { item: MenuItem; className?: string; style?: React.CSSProperties }) {
  return (
    <Link
      href={item.url}
      target={item.newWindow ? '_blank' : undefined}
      className={className}
      style={style}
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
        className="block px-4 py-3 text-[15px] font-semibold hover:text-accent transition-colors"
      />
    )
  return (
    <div className="group relative">
      <MenuLink
        item={item}
        className="flex items-center gap-1 px-4 py-3 text-[15px] font-semibold hover:text-accent transition-colors after:content-['▾'] after:text-[10px] after:text-ink-soft"
      />
      <div className="invisible absolute left-0 top-full z-40 min-w-52 border border-line bg-paper opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
        {item.children.map((c) => {
          const hasKids = c.children.length > 0
          return (
            <div key={c.id} className="group/sub relative">
              <MenuLink
                item={c}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-paper-2 hover:text-accent ${hasKids ? "after:content-['›'] after:text-ink-soft" : ''}`}
              />
              {hasKids && (
                // pl-1 bridges the gap so the mouse can travel into the flyout without it closing
                <div className="invisible absolute left-full top-0 z-50 min-w-48 pl-1 opacity-0 transition-all group-hover/sub:visible group-hover/sub:opacity-100">
                  <div className="border border-line bg-paper shadow-lg">
                    {c.children.map((g) => (
                      <MenuLink
                        key={g.id}
                        item={g}
                        className="block px-4 py-2.5 text-sm hover:bg-paper-2 hover:text-accent"
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

function MobileItem({ item, depth }: { item: MenuItem; depth: number }) {
  return (
    <>
      <MenuLink
        item={item}
        className={`block border-b border-line py-2.5 text-sm ${depth === 0 ? 'px-5 font-semibold' : 'text-ink-soft'}`}
        style={depth > 0 ? { paddingLeft: 20 + depth * 16 } : undefined}
      />
      {item.children.map((c) => (
        <MobileItem key={c.id} item={c} depth={depth + 1} />
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
      {/* top strip: date + socials */}
      <div className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-xs text-ink-soft">
          <span suppressHydrationWarning>
            {new Date().toLocaleDateString('te-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <SocialIcons settings={settings} className="h-4 w-4" />
        </div>
      </div>

      {/* masthead */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:py-6">
          <button
            className="p-2 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>

          <Link href="/" className="mx-auto md:mx-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={settings.site_name} className="h-12 md:h-14 w-auto" />
            ) : (
              <span className="headline text-3xl md:text-4xl text-ink">
                {settings.site_name || 'AK Ganesh'}
                <span className="text-accent">.</span>
              </span>
            )}
          </Link>

          <button
            className="p-2"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
        </div>
      </div>

      {/* search drawer */}
      {searchOpen && (
        <div className="border-b border-line bg-paper-2">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="వార్తలు వెతకండి…"
              className="w-full rounded-md border border-line bg-paper px-4 py-2 outline-none focus:border-accent"
            />
            <button className="rounded-md bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-dark">
              వెతకండి
            </button>
          </form>
        </div>
      )}

      {/* sticky nav */}
      <nav className="sticky top-0 z-50 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto hidden max-w-6xl items-center px-4 md:flex">
          {menus.map((m) => (
            <DesktopItem key={m.id} item={m} />
          ))}
        </div>

        {/* mobile menu — full 3-level tree, indented by depth */}
        {open && (
          <div className="border-t border-line md:hidden">
            {menus.map((m) => (
              <MobileItem key={m.id} item={m} depth={0} />
            ))}
          </div>
        )}
      </nav>
    </>
  )
}
