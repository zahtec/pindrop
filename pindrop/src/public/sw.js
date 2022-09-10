const V = '1';

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(`v${V}`).then(async cache => {
            await cache.addAll(['/', '/globals.css', '/qr.js', '/zip.js', '/index.js', './icons.js', '/icon.png', '/mask.webp', './manifest.json']);
            self.skipWaiting();
        })
    );
});

// Enable preloading and remove old cache
self.addEventListener('activate', e => {
    e.waitUntil(
        (async () => {
            // Remove old cache
            (await caches.keys()).forEach(async key => {
                if (key !== `v${V}`) await caches.delete(key);
            });
        })()
    );
});

// Check for connection
self.addEventListener('fetch', e => {
    e.respondWith(
        (async () => {
            // Check to see if the desired resource is in the cache
            const cache = await caches.match(e.request);
            if (cache) return cache;

            // Otherwise use the network, if it fails, ignore it because the user is offline
            return fetch(e.request).catch();
        })()
    );
});
