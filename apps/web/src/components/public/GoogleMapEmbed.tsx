'use client'

import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CHANGED_EVENT, readConsent, writeConsent } from '@/lib/cookieConsent'

// Loading the iframe unconditionally sets Google's own cookies regardless of
// what a visitor chose in the cookie banner — same category of tracking as
// Analytics, just easy to miss since it's "just a map". Gated the same way:
// stays a placeholder until Maps consent is granted (from the banner, the
// preferences panel, or the button below), and reacts live if consent
// changes elsewhere on the page without a reload.
export function GoogleMapEmbed({ query }: { query: string }) {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    setAllowed(!!readConsent()?.maps)
    function onChange(e: Event) {
      setAllowed(!!(e as CustomEvent).detail?.maps)
    }
    window.addEventListener(CHANGED_EVENT, onChange)
    return () => window.removeEventListener(CHANGED_EVENT, onChange)
  }, [])

  function loadNow() {
    const existing = readConsent()
    writeConsent({ analytics: existing?.analytics ?? false, maps: true })
    setAllowed(true)
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-card px-6 py-16 text-center">
        <MapPin className="size-6 text-ink-soft" />
        <p className="max-w-sm text-sm text-ink-2">
          The map is provided by Google Maps, which sets its own cookies once loaded.
        </p>
        <Button size="sm" onClick={loadNow}>Load Map</Button>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <iframe
        title="Office location"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
        width="100%"
        height="360"
        style={{ border: 0, filter: 'grayscale(0.15) contrast(1.05)' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
