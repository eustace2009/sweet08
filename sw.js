/* 甜蜜時光 — Service Worker
   ------------------------------------------------------------------
   改版時只要調整 VERSION，舊快取會在 activate 階段自動清掉。
   路徑一律用相對路徑，整包放到子目錄（例如 GitHub Pages）也能運作。
   ------------------------------------------------------------------ */

const VERSION = 'v1.2.0';
const SHELL_CACHE = `sweet-time-shell-${VERSION}`;
const IMAGE_CACHE = `sweet-time-images-${VERSION}`;
const FONT_CACHE = `sweet-time-fonts-${VERSION}`;
const VENDOR_CACHE = `sweet-time-vendor-${VERSION}`;
const IMAGE_LIMIT = 60;

/* 應用外殼：安裝時全部預先快取，之後離線可完整開啟 */
const SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/data.js',
  './js/orders.js',
  './js/analytics.js',
  './js/app.js',
  './js/pwa.js',
  './img/candy-01.svg',
  './img/candy-02.svg',
  './img/candy-03.svg',
  './img/candy-04.svg',
  './img/candy-05.svg',
  './img/candy-06.svg',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

/* ------------------------------------------------------------------
   安裝
   ------------------------------------------------------------------ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch((err) => console.warn('[SW] 預快取部分失敗：', err))
  );
});

/* ------------------------------------------------------------------
   啟用：清除舊版本快取
   ------------------------------------------------------------------ */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL_CACHE, IMAGE_CACHE, FONT_CACHE, VENDOR_CACHE];
    const names = await caches.keys();
    await Promise.all(names.map((name) => (keep.includes(name) ? null : caches.delete(name))));

    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

/* 前端按下「立即更新」時，跳過等待直接接管 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ------------------------------------------------------------------
   工具：限制圖片快取數量，避免無限長大
   ------------------------------------------------------------------ */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
}

/* ------------------------------------------------------------------
   取用策略
   ------------------------------------------------------------------ */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  /* 只處理 GET，且略過瀏覽器擴充功能等特殊協定 */
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  /* 分析工具永遠走網路，離線時安靜失敗，不佔快取 */
  if (/googletagmanager\.com|google-analytics\.com|analytics\.google\.com/.test(url.hostname)) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 204 })));
    return;
  }

  /* 網頁導覽：先網路（拿得到最新內容），失敗改快取，再失敗給離線頁 */
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        const fresh = await fetch(request);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        /* 先看這個網址本身有沒有快取 */
        const exact = await caches.match(request, { ignoreSearch: true });
        if (exact) return exact;

        /* 是站台入口就給應用外殼，其他未知網址給離線頁 */
        const root = new URL('./', self.registration.scope).pathname;
        const isEntry = url.pathname === root || url.pathname === root + 'index.html';
        if (isEntry) {
          const shell = await caches.match('./index.html', { ignoreSearch: true });
          if (shell) return shell;
        }
        return caches.match('./offline.html');
      }
    })());
    return;
  }

  /* Supabase API：一律走網路。訂單資料不該被快取，
     離線時讓它失敗，由 orders.js 存進本機佇列後補送。 */
  if (/supabase\.(co|in)$/.test(url.hostname)) return;

  /* supabase-js SDK（jsDelivr）：快取起來，第二次開站就不必再抓 */
  if (/cdn\.jsdelivr\.net/.test(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, VENDOR_CACHE));
    return;
  }

  /* 字型：stale-while-revalidate，第一次載入後離線也有字 */
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  /* 圖片：快取優先，背景補齊，並限制筆數 */
  if (request.destination === 'image') {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        if (fresh && (fresh.ok || fresh.type === 'opaque')) {
          cache.put(request, fresh.clone());
          trimCache(IMAGE_CACHE, IMAGE_LIMIT);
        }
        return fresh;
      } catch (e) {
        /* 離線且沒快取：交回錯誤，由頁面的 data-fallback 換成本地插圖 */
        return Response.error();
      }
    })());
    return;
  }

  /* 同源靜態資源（CSS / JS / manifest / icons）：快取優先 + 背景更新 */
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
  }
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || network || Response.error();
}
