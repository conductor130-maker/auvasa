const CACHE_NAME = 'auvasa-v602';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Ignorar peticiones que no sean de nuestra web
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Si está en caché, lo devolvemos
      if (response) return response;

      // Si no, lo pedimos a internet
      return fetch(event.request).then(res => {
        // Si la respuesta es buena, la guardamos
        if (res && res.status === 200 && event.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        // Si hay un fallo de red y es una navegación, devolvemos el index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // Si no, devolvemos una respuesta vacía para que no de error
        return new Response('', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});