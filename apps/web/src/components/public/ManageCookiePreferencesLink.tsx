'use client'

import { openCookiePreferences } from '@/lib/cookieConsent'

export function ManageCookiePreferencesLink() {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="text-xs text-ink-soft underline transition-colors hover:text-accent"
    >
      Manage Cookie Preferences
    </button>
  )
}
