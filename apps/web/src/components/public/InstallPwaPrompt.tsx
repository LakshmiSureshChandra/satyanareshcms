'use client'

import { useEffect, useState } from 'react'

const DISMISS_KEY = 'pwa-install-dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPwaPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    const alreadyDismissed = sessionStorage.getItem(DISMISS_KEY) === '1'

    if (!isMobile || standalone || alreadyDismissed) return

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // wait for the cookie-consent banner to clear first — both are fixed bottom bars
    function tryShowIOS() {
      if (ios && localStorage.getItem('cookie-consent') !== null) setVisible(true)
    }
    tryShowIOS()
    window.addEventListener('cookie-consent-resolved', tryShowIOS)

    function onPrompt(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      if (localStorage.getItem('cookie-consent') !== null) setVisible(true)
      else window.addEventListener('cookie-consent-resolved', () => setVisible(true), { once: true })
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('cookie-consent-resolved', tryShowIOS)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink px-4 py-3 text-paper shadow-lg">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install AK Ganesh</p>
          <p className="truncate text-xs text-paper/70">
            {isIOS ? 'Tap the Share icon, then "Add to Home Screen"' : 'Add the app to your home screen for quick access'}
          </p>
        </div>
        {!isIOS && (
          <button onClick={install} className="shrink-0 rounded-md bg-accent px-4 py-2 text-xs font-semibold hover:bg-accent-dark">
            Install
          </button>
        )}
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-md p-2 text-paper/60 hover:text-paper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  )
}
