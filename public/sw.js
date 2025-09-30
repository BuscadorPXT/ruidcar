/**
 * Service Worker para RuidCar Map
 * Implementa cache offline e funcionalidades PWA básicas
 */

const CACHE_NAME = 'ruidcar-map-v1';
const OFFLINE_URL = '/offline.html';

// Assets essenciais para cache
const ESSENTIAL_ASSETS = [
  '/',
  '/mapa',
  '/offline.html',
  '/manifest.json'
];

// APIs para cache com estratégia stale-while-revalidate
const API_CACHE_PATTERNS = [
  '/api/workshops',
  '/api/workshops/search',
  '/api/workshops/nearby'
];

// Assets estáticos para cache (imagens, CSS, JS)
const STATIC_CACHE_PATTERNS = [
  /\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/,
  /\/assets\//,
  /\/images\//
];

/**
 * Install Event - Cache essential assets
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(ESSENTIAL_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache essential assets:', error);
      })
  );
});

/**
 * Activate Event - Clean old caches
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Implement caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (external APIs, CDNs)
  if (url.origin !== location.origin) return;

  // API Requests - Stale While Revalidate
  if (isApiRequest(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Static Assets - Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation Requests - Network First with offline fallback
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirst(request));
});

/**
 * Cache Strategies
 */

/**
 * Stale While Revalidate - Good for API data
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fetch fresh data in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Cache First - Good for static assets
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Failed to fetch:', request.url, error);
    throw error;
  }
}

/**
 * Network First - Good for HTML pages
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Network First with Offline Fallback - Good for navigation
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);

    // Try to find cached version of requested page
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If navigation request and offline, show offline page
    if (isNavigationRequest(request)) {
      const offlineResponse = await cache.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    throw error;
  }
}

/**
 * Helper Functions
 */

function isApiRequest(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pathname.includes(pattern));
}

function isStaticAsset(pathname) {
  return STATIC_CACHE_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(pathname);
    }
    return pathname.includes(pattern);
  });
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

/**
 * Background Sync for offline actions
 */
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'search-sync') {
    event.waitUntil(syncOfflineSearches());
  }
});

async function syncOfflineSearches() {
  try {
    // Get pending searches from IndexedDB or localStorage
    const pendingSearches = await getPendingSearches();

    for (const search of pendingSearches) {
      try {
        await fetch('/api/workshops/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: search.query })
        });

        // Remove from pending after successful sync
        await removePendingSearch(search.id);
      } catch (error) {
        console.warn('[SW] Failed to sync search:', search.query, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Mock functions - replace with actual implementation
async function getPendingSearches() {
  return []; // Return pending searches from storage
}

async function removePendingSearch(id) {
  // Remove search from storage
}

/**
 * Push Notifications (basic setup)
 */
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');

  const options = {
    body: 'Nova oficina RuidCar disponível perto de você!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'workshop-notification',
    actions: [
      {
        action: 'view',
        title: 'Ver no mapa'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('RuidCar', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/mapa')
    );
  }
});

/**
 * Performance monitoring
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_METRICS') {
    console.log('[SW] Performance metrics:', event.data.metrics);
    // Could send to analytics service
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker script loaded successfully');