/* VitaScore: aumentar la versión de caché al publicar cambios. */
const VERSION = 'vitascore-v3-20261112';
const ARCHIVOS = ['./','./index.html','./styles.css','./news2.js','./app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && (k.startsWith('news2-') || k.startsWith('vitascore-'))).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return; e.respondWith(fetch(e.request).then(response => { if (response.ok) {const copy=response.clone(); caches.open(VERSION).then(cache => cache.put(e.request, copy));} return response; }).catch(() => caches.match(e.request))); });
