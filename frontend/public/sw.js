/* BidBlitz Service Worker - PWA mit Offline-Support */

const CACHE_NAME = 'bidblitz-v2';
const STATIC_CACHE = 'bidblitz-static-v2';
const DYNAMIC_CACHE = 'bidblitz-dynamic-v2';

// Statische Ressourcen zum Cachen
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - Cache statische Ressourcen
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2...');
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
              .map(key => {
                console.log('[SW] Deleting old cache:', key);
                return caches.delete(key);
              })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests (always network)
  if (url.pathname.startsWith('/api')) return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Clone response for cache
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE)
          .then(cache => cache.put(request, responseClone));
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Push event - Benachrichtigungen empfangen
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'BidBlitz',
    body: 'Neue Benachrichtigung',
    icon: 'https://static.prod-images.emergentagent.com/jobs/c06a809b-0544-4c06-aed9-1ffa762eed1f/images/7b0d0da66bfd29d4c1b2a0b40c438989272ac3c5e4abbbbee74b0ed4c654a120.png',
    badge: 'https://static.prod-images.emergentagent.com/jobs/c06a809b-0544-4c06-aed9-1ffa762eed1f/images/7b0d0da66bfd29d4c1b2a0b40c438989272ac3c5e4abbbbee74b0ed4c654a120.png',
    tag: 'bidblitz-notification',
    data: {}
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || {},
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
        vibrate: payload.vibrate || [200, 100, 200]
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    actions: data.actions,
    requireInteraction: data.requireInteraction,
    vibrate: data.vibrate
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  // Handle action buttons
  if (event.action === 'bid') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.auctionUrl || '/auctions')
    );
    return;
  }
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/notifications')
    );
    return;
  }
  
  // Default: open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-bids') {
    event.waitUntil(syncBids());
  }
});

async function syncBids() {
  console.log('[SW] Syncing bids...');
}
