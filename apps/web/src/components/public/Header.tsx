'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronDown, LogIn, Menu, Search, X } from 'lucide-react'
import type { MenuItem, Settings } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TextSizeControl } from './TextSizeControl'
import { ThemeColorControl } from './ThemeColorControl'

function MenuLink({ item, className, onClick }: { item: MenuItem; className?: string; onClick?: () => void }) {
  return (
    <Link href={item.url} target={item.newWindow ? '_blank' : undefined} className={className} onClick={onClick}>
      {item.title}
    </Link>
  )
}

// Click/tap-toggled (not CSS :hover) — a hover-only dropdown never opens on
// touch devices at this breakpoint (iPad, touchscreen laptops, Surface):
// there's no hover event, so tapping the parent item did nothing.
function DesktopSubmenu({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false)
  const [openSub, setOpenSub] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setOpenSub(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setOpenSub(null) }}
        aria-expanded={open}
        className="flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
      >
        {item.title}
        <ChevronDown className={cn('size-3 text-ink-soft transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 min-w-56 pt-2">
          <div className="overflow-visible rounded-xl border border-line bg-card py-1.5 shadow-2xl shadow-black/40">
            {item.children.map((c) => {
              const hasKids = c.children.length > 0
              const subOpen = openSub === c.id
              return (
                <div key={c.id} className="relative">
                  {hasKids ? (
                    <button
                      type="button"
                      onClick={() => setOpenSub(subOpen ? null : c.id)}
                      aria-expanded={subOpen}
                      className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-ink-2 hover:bg-paper-2 hover:text-accent"
                    >
                      {c.title}
                      <ChevronDown className={cn('size-3 shrink-0 text-ink-soft transition-transform', subOpen && 'rotate-180')} />
                    </button>
                  ) : (
                    <MenuLink
                      item={c}
                      onClick={() => { setOpen(false); setOpenSub(null) }}
                      className="block px-4 py-2.5 text-sm text-ink-2 hover:bg-paper-2 hover:text-accent"
                    />
                  )}
                  {hasKids && subOpen && (
                    <div className="bg-paper-2/60 py-1">
                      {c.children.map((g) => (
                        <MenuLink
                          key={g.id}
                          item={g}
                          onClick={() => { setOpen(false); setOpenSub(null) }}
                          className="block px-6 py-2.5 text-sm text-ink-2 hover:bg-paper-2 hover:text-accent"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function DesktopItem({ item }: { item: MenuItem }) {
  if (!item.children.length) {
    return (
      <MenuLink
        item={item}
        className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
      />
    )
  }
  return <DesktopSubmenu item={item} />
}

function MobileItem({ item, depth, close }: { item: MenuItem; depth: number; close: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasKids = item.children.length > 0

  return (
    <div className="border-b border-line" style={depth > 0 ? { paddingLeft: 16 } : undefined}>
      <div className="flex items-center">
        <MenuLink
          item={item}
          onClick={close}
          className={cn('block flex-1 py-3', depth === 0 ? 'text-base font-semibold text-ink' : 'text-sm text-ink-2')}
        />
        {hasKids && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            aria-expanded={expanded}
            className="-m-2 shrink-0 p-2 text-ink-soft"
          >
            <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
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
    if (!q.trim()) return
    router.push(`/search?s=${encodeURIComponent(q.trim())}`)
    setSearchOpen(false)
    setOpen(false)
  }

  // "AK Ganesh & Co" → accent on the initials, matching the reference wordmark
  const name = settings.site_name || 'AK Ganesh & Co'
  const [firstWord, ...restWords] = name.split(' ')

  return (
    <header className="glass fixed inset-x-0 top-0 z-50 border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 flex-col leading-none" onClick={() => setOpen(false)}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="h-9 w-auto md:h-10" />
          ) : (
            <>
              <span className="text-lg font-bold tracking-tight text-ink md:text-xl">
                <span className="text-accent">{firstWord}</span>
                {restWords.length > 0 && ` ${restWords.join(' ')}`}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.15em] text-ink-soft">Chartered Accountants</span>
            </>
          )}
        </Link>

        {/* min-w-0 lets this shrink inside the flex row; overflow-x-auto lets a
            long menu scroll horizontally (each pill stays whitespace-nowrap)
            instead of squeezing item text into multiple lines */}
        <nav className="no-scrollbar hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex">
          {menus.map((m) => (
            <DesktopItem key={m.id} item={m} />
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <button
            onClick={() => { setSearchOpen(!searchOpen); setOpen(false) }}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="flex size-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:border-ink-soft hover:text-ink"
          >
            {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          </button>
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <TextSizeControl />
            <ThemeColorControl />
          </div>
          <Button asChild size="sm" className="hidden xl:inline-flex">
            <Link href="/contact">
              Book a Consultation
              <ArrowRight />
            </Link>
          </Button>

          <button
            onClick={() => { setOpen(!open); setSearchOpen(false) }}
            aria-label="Menu"
            aria-expanded={open}
            className="flex size-9 items-center justify-center rounded-full border border-line text-ink-2 lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl gap-2 px-4 py-3 sm:px-6">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles, updates, insights…"
              className="w-full rounded-full border border-line bg-paper-2 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft outline-none focus:border-accent"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>
      )}

      {/* mobile drawer — solid (not glass), capped to the viewport with its own
          scroll so a deeply nested menu can never run off-screen */}
      {open && (
        <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-paper px-5 pb-8 pt-2 lg:hidden">
          {menus.map((m) => (
            <MobileItem key={m.id} item={m} depth={0} close={() => setOpen(false)} />
          ))}
          <div className="mt-5 flex items-center gap-2 sm:hidden">
            <TextSizeControl />
            <ThemeColorControl />
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/contact">
                Book a Consultation
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/contact">
                <LogIn />
                Get in touch
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
