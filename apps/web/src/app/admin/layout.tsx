'use client'

import { useEffect } from 'react'

// The public site's text-size and color-theme controls set data-text-size /
// data-theme-color on <html>, which restyle the whole document — both rely on
// the true document root (rem units, and CSS variables cascading from :root),
// so there's no way to counteract them with CSS scoped to just the admin
// subtree. A visitor's preference also persists across a client-side
// navigation into /admin (same <html> element, no reload), so the admin panel
// must actively clear both itself rather than just never setting them. Wraps
// every /admin/* route, including login/forgot/reset which sit outside the
// (panel) layout.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.removeAttribute('data-text-size')
    document.documentElement.removeAttribute('data-theme-color')
  }, [])

  return children
}
