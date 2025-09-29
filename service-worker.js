const CACHE_NAME = 'kinho-cache-v1';
const urlsToCache = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './assets/kinho-192.png',
  './assets/kinho-512.png'
];

// Instalando o SW e cacheando arquivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Ativando o SW
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Interceptando requisições e servindo do cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
