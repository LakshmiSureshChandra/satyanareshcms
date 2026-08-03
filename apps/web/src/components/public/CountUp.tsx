'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Animates 0 → `value` once the number scrolls into view. Renders the final
 * value immediately when the observer or animation isn't available (SSR,
 * reduced motion), so the figure is never stuck showing zero.
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  duration = 1600,
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const el = ref.current
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return

    let raf = 0
    const run = () => {
      let start: number | null = null
      const step = (ts: number) => {
        if (start === null) start = ts
        const progress = Math.min((ts - start) / duration, 1)
        setDisplay(Math.floor(progress * value))
        if (progress < 1) raf = requestAnimationFrame(step)
        else setDisplay(value)
      }
      raf = requestAnimationFrame(step)
    }

    setDisplay(0)

    // already on screen at mount — count up now instead of awaiting a callback
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      run()
      return () => cancelAnimationFrame(raf)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        run()
      },
      { threshold: 0.4 }
    )
    io.observe(el)

    // never leave the figure showing 0 because the observer never fired
    const failsafe = setTimeout(() => {
      io.disconnect()
      setDisplay(value)
    }, 3000)

    return () => {
      clearTimeout(failsafe)
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [value, duration])

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}
