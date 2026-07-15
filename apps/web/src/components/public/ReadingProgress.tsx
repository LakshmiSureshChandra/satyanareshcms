'use client'

import { useEffect, useState } from 'react'

// Thin gradient bar under the sticky header showing scroll progress.
export function ReadingProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? (el.scrollTop / total) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-1 bg-transparent">
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-accent to-amber-500 transition-[width] duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
