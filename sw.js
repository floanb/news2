
/*
  VitaScore
  Service Worker para funcionamiento sin conexión.
*/

const VERSION = 'vitascore-v4-20261112';

const ARCHIVOS = [
  './',
  './index.html',
  './styles.css',
  './news2.js',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// INSTALACIÓN
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(ARCHIVOS))
  );

  self.skipWaiting();
});

// ACTIVACIÓN Y LIMPIEZA DE CACHÉ ANTERIOR
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k =>
            k !== VERSION &&
            (
              k.startsWith('news2-') ||
              k.startsWith('vitascore-')
            )
          )
          .map(k => caches.delete(k))
      )
    )
  );

  self.clients.claim();
});

// FUNCIONAMIENTO CON Y SIN INTERNET
self.addEventListener('fetch', e => {

  if (
    e.request.method !== 'GET' ||
    new URL(e.request.url).origin !== self.location.origin
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {

        if (response.ok) {
          const copy = response.clone();

          caches.open(VERSION).then(cache => {
            cache.put(e.request, copy);
          });
        }

        return response;
      })
      .catch(() => caches.match(e.request))
  );

});
