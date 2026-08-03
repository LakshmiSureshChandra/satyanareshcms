'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Fades + lifts its children in once they scroll into view, then stops
 * observing. Falls back to simply being visible if IntersectionObserver is
 * unavailable, so content is never trapped at opacity 0.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    // Already on screen at mount (the hero, and anything above the fold): show
    // it straight away rather than waiting on an observer callback.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    io.observe(el)

    // Safety net: content must never be able to sit at opacity 0 permanently
    // because a callback didn't fire (headless/screenshot renderers and some
    // embedded webviews never run observer callbacks).
    const failsafe = setTimeout(() => {
      setVisible(true)
      io.disconnect()
    }, 3000)

    return () => {
      clearTimeout(failsafe)
      io.disconnect()
    }
  }, [])

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn('reveal', visible && 'visible', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  )
}
