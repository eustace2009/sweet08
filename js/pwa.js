/* 甜蜜時光 — PWA 執行階段
   1) 註冊 Service Worker
   2) 偵測新版本並提供「立即更新」
   3) 接管 A2HS 安裝提示
   4) 顯示連線狀態 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var toast = window.SweetToast || function () {};

  /* ------------------------------------------------------------------
     1 & 2. Service Worker 註冊與更新
     ------------------------------------------------------------------ */
  var refreshing = false;
  var updateRequested = false;   /* 只有使用者按了「立即更新」才重新載入 */

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(function (reg) {
          /* 已經有等待中的新版本 */
          if (reg.waiting) showUpdate(reg.waiting);

          reg.addEventListener('updatefound', function () {
            var incoming = reg.installing;
            if (!incoming) return;
            incoming.addEventListener('statechange', function () {
              if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdate(incoming);
              }
            });
          });

          /* 每小時檢查一次是否有新版 */
          setInterval(function () { reg.update(); }, 60 * 60 * 1000);
        })
        .catch(function (err) {
          console.warn('[PWA] Service Worker 註冊失敗：', err);
        });
    });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      /* 首次造訪時 clients.claim() 也會觸發這個事件。
         若在這裡無條件 reload，頁面會在載入途中被打斷。 */
      if (!updateRequested || refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  function showUpdate(worker) {
    var bar = $('update-bar');
    bar.hidden = false;
    $('update-btn').onclick = function () {
      bar.hidden = true;
      updateRequested = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
  }

  /* ------------------------------------------------------------------
     3. 安裝提示（Chrome / Edge / Android）
     ------------------------------------------------------------------ */
  var deferredPrompt = null;
  var installBtn = $('install-btn');

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.add('is-available');
    window.Analytics.pwa('install_available');
  });

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) {
      /* iOS Safari 不支援 beforeinstallprompt，改給文字說明 */
      toast('在 Safari 點「分享」→「加入主畫面」即可安裝', 'warn');
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      window.Analytics.pwa('install_prompt', { outcome: choice.outcome });
      if (choice.outcome === 'accepted') installBtn.classList.remove('is-available');
      deferredPrompt = null;
    });
  });

  window.addEventListener('appinstalled', function () {
    installBtn.classList.remove('is-available');
    window.Analytics.pwa('installed');
    toast('甜蜜時光已加到你的主畫面');
  });

  /* iOS 且尚未以獨立視窗開啟時，仍顯示按鈕（點了會給安裝說明） */
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var standalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isIOS && !standalone) installBtn.classList.add('is-available');
  if (standalone) window.Analytics.pwa('launch_standalone');

  /* ------------------------------------------------------------------
     4. 連線狀態
     ------------------------------------------------------------------ */
  var banner = $('net-banner');

  function syncNetwork(announce) {
    var offline = !navigator.onLine;
    banner.hidden = !offline;
    if (announce) {
      toast(offline ? '已離線，先逛先挑，等連線再結帳' : '連線恢復', offline ? 'error' : 'ok');
    }
    if (offline) window.Analytics.pwa('offline_view');
  }

  window.addEventListener('online', function () { syncNetwork(true); });
  window.addEventListener('offline', function () { syncNetwork(true); });
  syncNetwork(false);
})();
