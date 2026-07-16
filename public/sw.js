const CACHE_NAME = 'camdiag-shell-v2';
const STATIC_ASSETS = [
  '/index.html',
  '/brand/camdiag-logo.png',
  '/brand/camdiag-logo-animation.mp4',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const isUpgrade = keys.some((key) => key.startsWith('camdiag-') && key !== CACHE_NAME);
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();

      // Existing v1 clients cannot hear the new update event, so refresh them once.
      if (isUpgrade) {
        const clients = await self.clients.matchAll({ type: 'window' });
        await Promise.allSettled(clients.map((client) => client.navigate(client.url)));
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;

  if (url.pathname.startsWith('/api')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request, { cache: 'no-store' });
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/index.html', response.clone());
          }
          return response;
        } catch {
          return (await caches.match('/index.html')) || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  const fetched = fetch(event.request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  });

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        event.waitUntil(fetched.catch(() => undefined));
        return cached;
      }
      return fetched.catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
