const CACHE_NAME = 'reclaim-city-v2';

// API answers (/whoami, collective.json) describe the visitor or tonight's
// numbers and must always come from the network. Never intercept them.
function shouldIntercept(url) {
  return !url.pathname.includes('/api/');
}

const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './router.js',
  './state.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Code and data (scripts, the stylesheet, JSON) are network-first: the first
// load after a deploy runs the new release, and the bug reporter's version
// (read from the page's style.css?v=) matches the code that is running. The
// cache is only the offline copy. `no-cache` revalidates past the browser's
// HTTP cache, where nginx keeps static files for days.
function isCode(url, request) {
  return /\.(m?js|css|json)$/.test(url.pathname) || ['script', 'style', 'worker'].includes(request.destination);
}

function keep(key, response) {
  if (!response || !response.ok || response.redirected) return;
  const clone = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(key, clone));
}

function networkFirst(request, key, init) {
  return fetch(request, init)
    .then((response) => { keep(key, response); return response; })
    .catch((err) => caches.match(key).then((cached) => cached || Promise.reject(err)));
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (url.origin !== location.origin) return;
  if (!shouldIntercept(url)) return;

  // The page: from the network, kept as the offline copy of index.html, so
  // offline it is the newest page that loaded and asks for that release's files.
  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request, './index.html'));
    return;
  }

  if (isCode(url, e.request)) {
    e.respondWith(networkFirst(e.request, e.request, { cache: 'no-cache' }));
    return;
  }

  // Images and icons: from the cache, refreshed behind the page.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((response) => {
        keep(e.request, response);
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('reclaim-city') || client.url.includes('localhost')) {
          return client.focus();
        }
      }
      return self.clients.openWindow('./');
    })
  );
});
