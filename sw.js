// 青甘自驾环线 PWA Service Worker
const CACHE = 'qinggan-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  // 地图瓦片走网络，不缓存
  if (/tile\.openstreetmap\.org|\.tile\./i.test(url.hostname)) {
    e.respondWith(fetch(e.request).catch(function () { return caches.match(e.request); }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) { return cached; }
      return fetch(e.request).then(function (res) {
        if (res && res.status === 200 && (url.protocol === 'http:' || url.protocol === 'https:')) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
