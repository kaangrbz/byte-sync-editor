// ByteSync Editor Service Worker
const CACHE_NAME = 'bytesync-editor-v1.42.4';
const CACHE_NAME = 'bytesync-editor-v1.42.6';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './theme.js',
  './src/utils.js',
  './assets/logo.png',
  './AppIcon.iconset/icon_128x128.png',
  './AppIcon.iconset/icon_256x256.png',
  './AppIcon.iconset/icon_512x512.png',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: All files cached');
        // Yeni service worker'ı hemen aktif et
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      // Tüm client'lara güncelleme bildirimi gönder
      return self.clients.claim().then(() => {
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              message: 'Yeni güncelleme mevcut!'
            });
          });
        });
      });
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Fetch from network
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache the response (don't wait for it)
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.error('Service Worker: Cache put failed', error);
              });

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Network fetch failed', error);
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('./index.html')
                .then((offlinePage) => {
                  // If offline page exists, return it, otherwise return a basic response
                  if (offlinePage) {
                    return offlinePage;
                  }
                  // Fallback: return a basic HTML response
                  return new Response('<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1></body></html>', {
                    headers: { 'Content-Type': 'text/html' }
                  });
                });
            }
            // For non-document requests, return a basic error response
            return new Response('Network error', {
              status: 408,
              statusText: 'Request Timeout'
            });
          });
      })
      .catch((error) => {
        console.error('Service Worker: Cache match failed', error);
        // Fallback: try to fetch from network
        return fetch(event.request)
          .catch(() => {
            // If fetch also fails, return error response
            return new Response('Service unavailable', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  // Future: implement background sync for saving data
});

// Handle push notifications (if needed in future)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  // Future: implement push notifications
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

