'use client'

import { useEffect, useRef, useState } from 'react'

const SIZES = [
  { key: 'sm', px: 12 },
  { key: 'md', px: 15 },
  { key: 'lg', px: 18 },
  { key: 'xl', px: 21 },
] as const
type SizeKey = (typeof SIZES)[number]['key']

export function TextSizeControl() {
  const [size, setSize] = useState<SizeKey>('md')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('text-size') as SizeKey | null
    if (saved) setSize(saved)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function choose(key: SizeKey) {
    setSize(key)
    setOpen(false)
    localStorage.setItem('text-size', key)
    if (key === 'md') document.documentElement.removeAttribute('data-text-size')
    else document.documentElement.setAttribute('data-text-size', key)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Adjust text size"
        aria-expanded={open}
        className="flex items-center gap-0.5 rounded-md border border-line px-2.5 py-2.5 text-ink transition-colors hover:border-accent hover:text-accent"
      >
        <span className="text-[11px] font-bold leading-none">A</span>
        <span className="text-[16px] font-bold leading-none">A</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 flex items-center gap-1 whitespace-nowrap rounded-md border border-line bg-paper p-2 shadow-lg">
          <span className="mr-1 pl-1 text-xs font-medium text-ink-soft">Text size</span>
          {SIZES.map((s) => (
            <button
              key={s.key}
              onClick={() => choose(s.key)}
              aria-label={`Text size ${s.key}`}
              aria-pressed={size === s.key}
              style={{ fontSize: s.px }}
              className={`flex h-9 w-9 items-center justify-center rounded font-bold transition-colors ${
                size === s.key ? 'bg-accent text-white' : 'text-ink-soft hover:bg-paper-2'
              }`}
            >
              A
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
