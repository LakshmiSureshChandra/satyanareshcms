'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { REOPEN_EVENT, readConsent, writeConsent, type CookieConsent } from '@/lib/cookieConsent'

function loadGoogleAnalytics(gaSnippet: string) {
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

export function CookieBanner({ gaSnippet }: { gaSnippet: string }) {
  const [consent, setConsent] = useState<CookieConsent | null | 'checking'>('checking')
  const [showPrefs, setShowPrefs] = useState(false)
  // panel's in-progress selections, seeded from whatever's already stored when opened
  const [draft, setDraft] = useState<CookieConsent>({ analytics: false, maps: false })

  useEffect(() => {
    setConsent(readConsent())
    function reopen() {
      setDraft(readConsent() || { analytics: false, maps: false })
      setShowPrefs(true)
    }
    window.addEventListener(REOPEN_EVENT, reopen)
    return () => window.removeEventListener(REOPEN_EVENT, reopen)
  }, [])

  useEffect(() => {
    if (consent && consent !== 'checking' && consent.analytics && gaSnippet) loadGoogleAnalytics(gaSnippet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent === 'checking' ? null : consent?.analytics, gaSnippet])

  function apply(next: CookieConsent) {
    writeConsent(next)
    setConsent(next)
    setShowPrefs(false)
  }

  const bannerVisible = consent === null
  const panelVisible = bannerVisible || showPrefs
  if (!panelVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-60 border-t-2 border-ink bg-paper shadow-2xl">
      <div className="mx-auto max-w-6xl p-4">
        {showPrefs ? (
          <div>
            <h2 className="text-sm font-bold text-ink">Cookie Preferences</h2>
            <div className="mt-3 space-y-3">
              <div className="flex items-start justify-between gap-4 rounded-md border border-line p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Essential</p>
                  <p className="text-xs text-ink-soft">Required for the site to function. Always on.</p>
                </div>
                <input type="checkbox" checked disabled className="mt-1 size-4 shrink-0" />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-md border border-line p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Analytics (Google Analytics)</p>
                  <p className="text-xs text-ink-soft">Helps us understand site traffic and usage.</p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
                  className="mt-1 size-4 shrink-0"
                />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-md border border-line p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Maps (Google Maps)</p>
                  <p className="text-xs text-ink-soft">Loads the interactive map on our Contact page.</p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.maps}
                  onChange={(e) => setDraft((d) => ({ ...d, maps: e.target.checked }))}
                  className="mt-1 size-4 shrink-0"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => apply(draft)}>Save Preferences</Button>
              <Button size="sm" variant="outline" onClick={() => apply({ analytics: true, maps: true })}>Accept All</Button>
              {bannerVisible ? null : (
                <Button size="sm" variant="ghost" onClick={() => setShowPrefs(false)}>Cancel</Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <div>
              <p className="text-sm font-bold text-ink">Cookie Notice</p>
              <p className="mt-1 text-sm text-ink-soft">
                We use cookies and similar technologies (including Google Analytics and Google Maps) to analyze
                site traffic and enhance your browsing experience. For more information, please read our{' '}
                <Link href="/page/privacy-policy" className="text-accent underline">Privacy Policy</Link>.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => apply({ analytics: false, maps: false })}>
                Reject Non-Essential
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setDraft({ analytics: false, maps: false }); setShowPrefs(true) }}>
                Preferences
              </Button>
              <Button size="sm" onClick={() => apply({ analytics: true, maps: true })}>Accept All</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
