import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SPA fallback
registerRoute(
  new NavigationRoute(new NetworkFirst({ networkTimeoutSeconds: 3 }))
)

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { return }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'AgriClean', {
      body:      data.body  ?? 'Nouveau message',
      icon:      '/icons/icon.svg',
      badge:     '/icons/icon.svg',
      tag:       data.tag   ?? 'agri-message',
      renotify:  true,
      data:      { url: data.url ?? '/' },
      vibrate:   [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url })
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
