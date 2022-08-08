const V = '1';

self.addEventListener('install', e => {
    e.waitUntil(
        caches
            .open(`main-v${V}`)
            .then(cache => {
                return cache.addAll(['/', '/globals.css', '/qr.js', '/zip.js', '/index.js', '/icon.webp', '/mask.webp']);
            })
            .then(() => self.skipWaiting())
    );
});

// Remove old cache
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(async cache => {
            if (cache.toString() !== `main-v${V}`) return await caches.delete(cache);
        })
    );
});

// Check for connection
self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request).catch(() => {
            caches.match(e.request);
        })
    );
});
