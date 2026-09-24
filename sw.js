// Service Worker — сверка склада. Сеть первая, кеш — запасной. При каждом обновлении менять CACHE_NAME.
var CACHE_NAME = 'sklad-sverka-v9';
var FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function (c) {
    // по одному, с catch — один недоступный файл не должен ломать установку (Ошибка 19)
    return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;   // Firebase, gstatic — мимо кеша
  e.respondWith(fetch(e.request).then(function (r) {
    if (r && r.status === 200) { var cl = r.clone(); caches.open(CACHE_NAME).then(function (c) { c.put(e.request, cl); }); }
    return r;
  }).catch(function () {
    return caches.match(e.request).then(function (c) { return c || (e.request.mode === 'navigate' ? caches.match('./index.html') : new Response('Офлайн', { status: 503 })); });
  }));
});
