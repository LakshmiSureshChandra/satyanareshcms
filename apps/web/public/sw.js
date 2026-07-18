// ponytail: bare-minimum service worker — a fetch handler is required for Chrome/Android
// to consider the site installable. No offline caching strategy yet; add one (e.g. cache the
// shell + last-viewed articles) if offline support is actually requested.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request))
})
