// BitComm Service Worker
const CACHE_NAME = 'bitcomm-v3'; // Force complete cache refresh
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/bitcomm-logo.svg',
  '/favicon.ico',
  '/favicon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For JS modules and dynamic imports, always fetch from network first
  const isJSModule = event.request.url.includes('/assets/') && event.request.url.endsWith('.js');
  const isDynamicImport = event.request.destination === 'script' || event.request.destination === '';
  
  if (isJSModule || isDynamicImport) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch((error) => {
          console.error('Service Worker: Failed to fetch JS module', event.request.url, error);
          // Fallback to cache for JS modules
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error;
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            // Cache the response for future requests
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed', error);
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// Handle background sync for offline message queue
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'bitcomm-message-sync') {
    event.waitUntil(
      // Implement message sync logic here
      syncOfflineMessages()
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New BitComm message received',
    icon: '/bitcomm-logo.svg',
    badge: '/bitcomm-logo.svg',
    vibrate: [200, 100, 200],
    tag: 'bitcomm-notification',
    actions: [
      {
        action: 'open',
        title: 'Open BitComm',
        icon: '/bitcomm-logo.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/bitcomm-logo.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BitComm', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync offline messages (placeholder implementation)
async function syncOfflineMessages() {
  try {
    console.log('Service Worker: Syncing offline messages...');
    // Implement actual message sync logic here
    // This would integrate with your P2P messaging system
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Message sync failed', error);
    throw error;
  }
}
