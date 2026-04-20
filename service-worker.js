const CACHE_NAME = 'symchess-v1';
const OFFLINE_URL = './index.html';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        "/",
        "./index.html",
        "./index_2.html",
        "./index_3.html",
        "./index_4.html",
        "./index_5.html",
        "./index_6.html",
        "./index_7.html",
        "./index_8.html",
        "./index_12.html",
        "./index_15.html",
        "./index_18.html",
        "./index_20.html",
        "./styles.css",
        "./script.js",
          "./style.css",
          "./style2.css",
          "./main.js",
          "./main_ai.js",
          "./main_ai4.js",
          "./main_kh.js",
          "./main960.js",
          "./main960ai.js",
          "./main960ai3.js"
      ])
    )
  );
});
self.addEventListener('activate', e => { self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
