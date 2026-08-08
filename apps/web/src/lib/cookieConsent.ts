'use client'

// Per-category consent, stored as JSON under the same localStorage key the
// site has always used — InstallPwaPrompt already treats "key exists" as
// "banner has been resolved" regardless of what's inside, so this stays
// compatible without touching that component.
export type CookieConsent = { analytics: boolean; maps: boolean }

const KEY = 'cookie-consent'
export const REOPEN_EVENT = 'open-cookie-preferences'
export const CHANGED_EVENT = 'cookie-consent-changed'
// legacy signal some components wait on to know the banner is no longer covering the screen
const RESOLVED_EVENT = 'cookie-consent-resolved'

export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.analytics === 'boolean' && typeof parsed.maps === 'boolean') return parsed
  } catch {
    // pre-existing visitors have the old plain "accepted" / "rejected" string —
    // that predates per-category consent, so treat it as unset and re-ask
  }
  return null
}

export function writeConsent(consent: CookieConsent) {
  localStorage.setItem(KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: consent }))
  window.dispatchEvent(new Event(RESOLVED_EVENT))
}

/** Opens (or reopens) the preferences panel — e.g. a "Manage Cookie Preferences" footer link. */
export function openCookiePreferences() {
  window.dispatchEvent(new Event(REOPEN_EVENT))
}
