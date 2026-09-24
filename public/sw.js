// Offline support is limited to a non-clinical shell. AI, records and uploads require connectivity.
const CACHE_NAME = 'camdiag-shell-v4';
const OFFLINE_ASSETS = ['/offline.html', '/offline.css'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)));
  // No skipWaiting: activation waits until old tabs close, never interrupting a consultation.
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('camdiag-') && key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => (await cache.match(url.pathname)) || fetch(event.request)));
    return;
  }
  // Never cache API responses, auth, source documents or arbitrary same-origin URLs.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () =>
      (await caches.open(CACHE_NAME)).match('/offline.html').then((response) => response || new Response('Offline', { status: 503 }))));
  }
});
