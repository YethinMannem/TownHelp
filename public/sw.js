// Bump SW_VERSION when you want all clients to get a fresh cache
const SW_VERSION = 'v3'
const SHELL_CACHE = `townhelp-shell-${SW_VERSION}`
const STATIC_CACHE = `townhelp-static-${SW_VERSION}`

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/apple-touch-icon.png',
]

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('townhelp-') && k !== SHELL_CACHE && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  // Next.js static chunks are content-hashed — cache forever
  if (request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Navigation requests — network first, graceful offline fallback.
  // Do not cache app pages here: many routes contain private booking/chat/profile data.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          const offline = await caches.match('/offline.html')
          return offline ?? new Response('You are offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
        })
    )
    return
  }

  // Other static assets (images, fonts, icons) — cache first
  if (/\.(js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2?)$/.test(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }
})

// ─── Messages from client ─────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data?.type === 'CLEAR_APP_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith('townhelp-')).map((key) => caches.delete(key)))
      )
    )
  }
})

// ─── Push notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'TownHelp'
  const options = {
    body: data.body ?? '',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: { url: data.url ?? '/', actionUrls: data.actionUrls ?? {} },
    tag: data.tag ?? 'townhelp-default',
    requireInteraction: data.requireInteraction ?? false,
    actions: data.actions ?? [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const { url, actionUrls } = event.notification.data ?? {}
  const target = event.action && actionUrls?.[event.action]
    ? actionUrls[event.action]
    : (url ?? '/')

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === target && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(target)
    })
  )
})
