/// <reference lib="webworker" />

/**
 * WiFi Free Map Service Worker
 * 實現離線支援與地圖圖塊緩存
 */

/** 緩存名稱 / Cache names */
const CACHE_NAME = 'wifi-free-map-v1';
const TILE_CACHE = 'wifi-free-map-tiles-v1';

/** 要快取的資源 / Resources to cache */
const STATIC_ASSETS = [
    '/',
    '/map',
];

/** 離線回應 / Offline response */
const OFFLINE_URL = '/offline.html';

/**
 * 安裝事件處理 / Install event handler
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => {
            console.log('[SW] Service worker installed');
            return self.skipWaiting();
        })
    );
});

/**
 * 啟動事件處理 / Activate event handler
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== TILE_CACHE)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            console.log('[SW] Service worker activated');
            return self.clients.claim();
        })
    );
});

/**
 * 獲取請求事件處理 / Fetch event handler
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 僅處理同源請求 / Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // API 請求使用網路優先策略 / API requests: network first
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        return cached || new Response(
                            JSON.stringify({ error: 'offline', cached: true }),
                            { headers: { 'Content-Type': 'application/json' } }
                        );
                    });
                })
        );
        return;
    }

    // 地圖圖塊使用快取優先策略 / Map tiles: cache first
    if (url.pathname.includes('/tile') || url.pathname.includes('/osm')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    return cached;
                }
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(TILE_CACHE).then((cache) => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // 靜態資源使用快取優先 / Static assets: cache first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                return cached;
            }
            return fetch(request);
        })
    );
});

/**
 * 背景同步 / Background sync
 */
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);
    if (event.tag === 'sync-hotspots') {
        event.waitUntil(syncHotspots());
    }
});

/**
 * 同步熱點資料 / Sync hotspots data
 */
async function syncHotspots() {
    try {
        const response = await fetch('/api/hotspots/user', {
            method: 'POST',
        });
        if (response.ok) {
            console.log('[SW] Hotspots synced');
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

/**
 * 推送通知 / Push notifications
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
