const CACHE_NAME = 'pwa-tips-v1';
const CORE_FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/marked.min.js',
    '/manifest.json',
    '/data/index.json'
];

// Cài đặt Service Worker và Cache các file cốt lõi
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CORE_FILES);
        })
    );
});

// Xóa cache cũ nếu có version mới
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Chặn các request fetch để phục vụ file từ Cache
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Nếu có trong cache, trả về luôn (Offline first cho các file tĩnh)
            if (response) {
                return response;
            }
            
            // Nếu không có, fetch qua mạng
            return fetch(event.request).then(networkResponse => {
                // Nếu là file markdown (.md), tự động lưu vào cache để lần sau có thể đọc offline
                if (event.request.url.endsWith('.md')) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        }).catch(() => {
            // Xử lý khi mất mạng và không có trong cache
            return new Response('<h2>Bạn đang offline và nội dung này chưa được tải về máy.</h2>', {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        })
    );
});
