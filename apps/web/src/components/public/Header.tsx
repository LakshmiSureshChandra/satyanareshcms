'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

// hasRealUrl: parent items that are pure groupings (url "#", set that way in
// the menu builder) have nothing to navigate to — those stay click/tap-to-
// toggle only. A parent that also has its own page gets the label split from
// the toggle: hovering (mouse) or tapping the chevron (touch) reveals the
// dropdown, while clicking/tapping the label text navigates normally, same
// as any other link.
function hasRealUrl(url: string) {
  return !!url && url.trim() !== '' && url.trim() !== '#'
}

// The panel is portaled to document.body and positioned with `fixed` +
// coordinates read from the trigger's own getBoundingClientRect(). It cannot
// be a normal absolutely-positioned child of the trigger: the nav row is
// horizontally scrollable (overflow-x-auto), and per spec that silently
// forces overflow-y to 'auto' too — any child positioned outside the row's
// own (single-line) height would get clipped to invisible.
function DesktopSubmenu({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false)
  const [openSub, setOpenSub] = useState<number | null>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function openAt() {
    clearTimeout(closeTimer.current)
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: r.left })
    }
    setOpen(true)
  }
  function scheduleClose() {
    clearTimeout(closeTimer.current)
    // short delay so moving the mouse from trigger down into the (visually
    // adjacent, but DOM-detached via portal) panel doesn't close it first
    closeTimer.current = setTimeout(() => { setOpen(false); setOpenSub(null) }, 150)
  }
  function toggleClick() {
    if (open) { setOpen(false); setOpenSub(null) }
    else openAt()
  }

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
      setOpenSub(null)
    }
    // closes rather than tracking a stale position across scroll/resize
    function onCloseTrigger() {
      setOpen(false)
      setOpenSub(null)
    }
    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', onCloseTrigger, true)
    window.addEventListener('resize', onCloseTrigger)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('scroll', onCloseTrigger, true)
      window.removeEventListener('resize', onCloseTrigger)
    }
  }, [open])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const linkable = hasRealUrl(item.url)
  const pillClass = 'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink'

  return (
    <div ref={wrapRef} onMouseEnter={openAt} onMouseLeave={scheduleClose}>
      <div ref={triggerRef} className={linkable ? 'flex items-center' : undefined}>
        {linkable ? (
          <>
            <MenuLink item={item} onClick={() => { setOpen(false); setOpenSub(null) }} className={cn(pillClass, 'pr-1.5')} />
            <button
              type="button"
              onClick={toggleClick}
              aria-expanded={open}
              aria-label={`Show ${item.title} submenu`}
              className="-ml-2 flex shrink-0 items-center rounded-full py-2 pl-1 pr-3 text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
            >
              <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
            </button>
          </>
        ) : (
          <button type="button" onClick={toggleClick} aria-expanded={open} className={pillClass}>
            {item.title}
            <ChevronDown className={cn('size-3 text-ink-soft transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 min-w-56"
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={openAt}
            onMouseLeave={scheduleClose}
          >
            <div className="overflow-hidden rounded-xl border border-line bg-card py-1.5 shadow-2xl shadow-black/40">
              {item.children.map((c) => {
                const hasKids = c.children.length > 0
                const subOpen = openSub === c.id
                const subLinkable = hasRealUrl(c.url)
                return (
                  <div key={c.id}>
                    {hasKids ? (
                      subLinkable ? (
                        <div className="flex items-center">
                          <MenuLink
                            item={c}
                            onClick={() => { setOpen(false); setOpenSub(null) }}
                            className="flex-1 px-4 py-2.5 text-sm text-ink-2 hover:bg-paper-2 hover:text-accent"
                          />
                          <button
                            type="button"
                            onClick={() => setOpenSub(subOpen ? null : c.id)}
                            aria-expanded={subOpen}
                            aria-label={`Show ${c.title} submenu`}
                            className="px-3 py-2.5 text-ink-soft hover:bg-paper-2 hover:text-accent"
                          >
                            <ChevronDown className={cn('size-3 transition-transform', subOpen && 'rotate-180')} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenSub(subOpen ? null : c.id)}
                          aria-expanded={subOpen}
                          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-ink-2 hover:bg-paper-2 hover:text-accent"
                        >
                          {c.title}
                          <ChevronDown className={cn('size-3 shrink-0 text-ink-soft transition-transform', subOpen && 'rotate-180')} />
                        </button>
                      )
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
          </div>,
          document.body
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
