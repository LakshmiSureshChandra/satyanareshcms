'use client'

import { useEffect, useState } from 'react'

// Consent gate: GA snippet (settings.google_analytics) is only injected after accept.
export function CookieBanner({ gaSnippet }: { gaSnippet: string }) {
  const [consent, setConsent] = useState<string | null>('pending')

  useEffect(() => {
    setConsent(localStorage.getItem('cookie-consent'))
  }, [])

  useEffect(() => {
    if (consent === 'accepted' && gaSnippet) {
      const container = document.createElement('div')
      container.innerHTML = gaSnippet
      container.querySelectorAll('script').forEach((old) => {
        const s = document.createElement('script')
        if (old.src) s.src = old.src
        else s.textContent = old.textContent
        s.async = old.async
        document.head.appendChild(s)
      })
    }
  }, [consent, gaSnippet])

  if (consent !== null) return null

  const choose = (value: string) => {
    localStorage.setItem('cookie-consent', value)
    setConsent(value)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t-2 border-ink bg-paper p-4 shadow-2xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 md:flex-row md:justify-between">
        <p className="text-sm text-ink-soft">
          మేము మీ అనుభవాన్ని మెరుగుపరచడానికి కుకీలను ఉపయోగిస్తాము. Read our{' '}
          <a href="/page/cookies-policy" className="text-accent underline">Cookies Policy</a>.
        </p>
        <div className="flex gap-2">
          <button onClick={() => choose('rejected')} className="rounded-md border border-line px-4 py-2 text-sm hover:bg-paper-2">
            తిరస్కరించు
          </button>
          <button onClick={() => choose('accepted')} className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
            అంగీకరించు
          </button>
        </div>
      </div>
    </div>
  )
}
