'use client'

import { useEffect, useRef, useState } from 'react'

// swatch colors mirror the CSS overrides in globals.css exactly, purely for
// preview. Paired with ink (the body text color), not accent — paper+ink is
// what actually reads as "this is the dark one" / "this is the sepia one" at
// a glance; accent is just a decorative highlight and looks the same
// (crimson) on both Default and Sepia, so it didn't distinguish anything.
const THEMES = [
  { key: 'default', label: 'Default', paper: '#fbfaf7', ink: '#191919' },
  { key: 'dark', label: 'Dark', paper: '#15130f', ink: '#f0ece3' },
  { key: 'sepia', label: 'Sepia', paper: '#f4ecd8', ink: '#3b2f22' },
  { key: 'contrast', label: 'High Contrast', paper: '#ffffff', ink: '#000000' },
] as const
type ThemeKey = (typeof THEMES)[number]['key']

function swatch(paper: string, ink: string) {
  return { background: `conic-gradient(${ink} 0 50%, ${paper} 50% 100%)` }
}

export function ThemeColorControl() {
  const [theme, setTheme] = useState<ThemeKey>('default')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme-color') as ThemeKey | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function choose(key: ThemeKey) {
    setTheme(key)
    setOpen(false)
    localStorage.setItem('theme-color', key)
    if (key === 'default') document.documentElement.removeAttribute('data-theme-color')
    else document.documentElement.setAttribute('data-theme-color', key)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change color theme"
        aria-expanded={open}
        className="flex items-center rounded-md border border-line p-2.5 transition-colors hover:border-accent"
      >
        {/* palette icon — a two-tone dot only reads as "a shape", not as a
            theme-switcher control; this is instantly recognizable as one */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6.5 2 2 6.5 2 12c0 3 2 5 5 5h1a2 2 0 0 1 2 2v1c0 1 1 2 2 2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
          <circle cx="6.7" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="9.7" cy="7" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="15" cy="7" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="17.8" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-md border border-line bg-paper p-2 shadow-lg">
          <p className="mb-1.5 px-1 text-xs font-medium text-ink-soft">Color theme</p>
          <div className="space-y-0.5">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => choose(t.key)}
                aria-pressed={theme === t.key}
                className={`flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors ${
                  theme === t.key ? 'bg-paper-2 font-semibold text-ink' : 'text-ink-soft hover:bg-paper-2'
                }`}
              >
                <span className="h-5 w-5 shrink-0 rounded-full" style={swatch(t.paper, t.ink)} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
