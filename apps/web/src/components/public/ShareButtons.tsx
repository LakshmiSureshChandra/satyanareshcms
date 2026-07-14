'use client'

import { useState } from 'react'

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const enc = encodeURIComponent(url)
  const encTitle = encodeURIComponent(title)

  const links: [string, string, string][] = [
    ['WhatsApp', `https://wa.me/?text=${encTitle}%20${enc}`, '#25D366'],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${enc}`, '#1877F2'],
    ['X', `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`, '#111111'],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`, '#0A66C2'],
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-ink-soft">షేర్ చేయండి:</span>
      {links.map(([label, href, color]) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: color }}
          className="rounded-full px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-85"
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
        {copied ? 'కాపీ అయింది ✓' : 'లింక్ కాపీ'}
      </button>
    </div>
  )
}
