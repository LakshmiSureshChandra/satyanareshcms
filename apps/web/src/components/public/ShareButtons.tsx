'use client'

import { useState } from 'react'

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const enc = encodeURIComponent(url)
  const encTitle = encodeURIComponent(title)

  // X's brand black vanishes against a dark page, so it carries a hairline
  // border to keep its edge readable on every theme.
  const links: [label: string, href: string, color: string, border?: string][] = [
    ['WhatsApp', `https://wa.me/?text=${encTitle}%20${enc}`, '#25D366'],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${enc}`, '#1877F2'],
    ['X', `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`, '#111111', 'rgba(255,255,255,0.28)'],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`, '#0A66C2'],
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-ink-soft">Share:</span>
      {links.map(([label, href, color, border]) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          style={{ backgroundColor: color, border: `1px solid ${border ?? color}` }}
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85"
        >
          {label}
        </a>
      ))}
      <button
        onClick={() => {
          navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className="rounded-full border border-line px-4 py-1.5 text-xs font-bold text-ink-soft hover:bg-paper-2"
      >
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
    </div>
  )
}
