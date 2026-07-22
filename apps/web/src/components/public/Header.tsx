'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MenuItem, Settings } from '@/lib/api'
import { SocialIcons } from './SocialIcons'
import { TextSizeControl } from './TextSizeControl'

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
        className="border-b-2 border-transparent px-4 py-3 text-[15px] font-semibold transition-colors hover:border-accent hover:text-accent"
      />
    )
  return (
    <div className="group relative">
      <MenuLink
        item={item}
        className="flex items-center gap-1 border-b-2 border-transparent px-4 py-3 text-[15px] font-semibold transition-colors hover:border-accent hover:text-accent after:content-['▾'] after:text-[10px] after:opacity-60"
      />
      <div className="invisible absolute left-0 top-full z-40 min-w-56 border border-line bg-paper py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
        {item.children.map((c) => {
          const hasKids = c.children.length > 0
          return (
            <div key={c.id} className="group/sub relative">
              <MenuLink
                item={c}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium hover:bg-paper-2 hover:text-accent ${hasKids ? "after:content-['›'] after:text-ink-soft" : ''}`}
              />
              {hasKids && (
                // pl-1 bridges the hover gap so the flyout doesn't close mid-travel
                <div className="invisible absolute left-full top-0 z-50 min-w-48 pl-1 opacity-0 transition-all group-hover/sub:visible group-hover/sub:opacity-100">
                  <div className="border border-line bg-paper py-1 shadow-lg">
                    {c.children.map((g) => (
                      <MenuLink
                        key={g.id}
                        item={g}
                        className="block px-4 py-2.5 text-sm font-medium hover:bg-paper-2 hover:text-accent"
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
  const [expanded, setExpanded] = useState(false)
  const hasKids = item.children.length > 0

  return (
    <div className="border-b border-line" style={depth > 0 ? { paddingLeft: 18 } : undefined}>
      <div className="flex items-center">
        <MenuLink
          item={item}
          onClick={close}
          className={`block flex-1 py-3 ${depth === 0 ? 'headline text-2xl' : 'text-base text-ink-soft'}`}
        />
        {hasKids && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            aria-expanded={expanded}
            className="-m-2 shrink-0 p-2 text-ink-soft"
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
      {hasKids && expanded && (
        <div className="pb-1">
          {item.children.map((c) => (
            <MobileItem key={c.id} item={c} depth={depth + 1} close={close} />
          ))}
        </div>
      )}
    </div>
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
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
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

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <TextSizeControl />
            <button
              className="rounded-md border border-line p-2.5 text-ink transition-colors hover:border-accent hover:text-accent"
              onClick={() => { setSearchOpen(!searchOpen); setOpen(false) }}
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
          </div>
        </div>

        {/* search drawer */}
        {searchOpen && (
          <div className="border-t border-line">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search news…"
                className="w-full rounded-md border border-line bg-white px-4 py-2.5 outline-none focus:border-accent"
              />
              <button className="rounded-md bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-dark">
                Search
              </button>
            </form>
          </div>
        )}

        {/* mobile overlay menu — solid (not glass), capped to the viewport with its own scroll
            so a large/deeply-nested menu can never push the page around or run off-screen */}
        {open && (
          <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-paper px-5 pb-8 pt-2 shadow-xl md:hidden">
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
