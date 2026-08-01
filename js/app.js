/* 甜蜜時光 — 介面邏輯 */
(function () {
  'use strict';

  var products = window.PRODUCTS || [];
  var CART_KEY = 'sweet-time.cart.v1';

  var state = {
    cart: loadCart(),
    category: '全部'
  };

  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return 'NT$ ' + n.toLocaleString('zh-TW'); };

  /* ---------------------------------------------------------------------
     購物車儲存：離線時整理購物車，關掉分頁也不會遺失
     --------------------------------------------------------------------- */
  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) { /* 無痕模式可忽略 */ }
  }

  function cartCount() {
    return state.cart.reduce(function (sum, i) { return sum + i.quantity; }, 0);
  }

  function cartTotal() {
    return state.cart.reduce(function (sum, i) { return sum + i.price * i.quantity; }, 0);
  }

  /* ---------------------------------------------------------------------
     圖片：外部商品照載入失敗時，換成本地插圖
     --------------------------------------------------------------------- */
  function watchImages(root) {
    root.querySelectorAll('img[data-fallback]').forEach(function (img) {
      img.addEventListener('error', function handle() {
        img.removeEventListener('error', handle);
        img.src = img.dataset.fallback;
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hero：櫃檯上攤開的三款樣品
     --------------------------------------------------------------------- */
  function renderHero() {
    var stack = $('hero-stack');
    var picks = products.slice(0, 3);
    stack.innerHTML = picks.map(function (p, i) {
      return '<figure>' +
        '<img src="' + p.remote + '" data-fallback="' + p.local + '" alt=""' +
        (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">' +
        '<span class="tag">' + p.name + '</span>' +
        '</figure>';
    }).join('');
    watchImages(stack);
  }

  /* ---------------------------------------------------------------------
     分類篩選
     --------------------------------------------------------------------- */
  function categories() {
    var seen = ['全部'];
    products.forEach(function (p) {
      if (seen.indexOf(p.category) === -1) seen.push(p.category);
    });
    return seen;
  }

  function renderFilters() {
    $('filters').innerHTML = categories().map(function (cat) {
      var on = cat === state.category;
      return '<button type="button" class="chip" data-cat="' + cat + '" aria-pressed="' + on + '">' +
        cat + '</button>';
    }).join('');
  }

  /* ---------------------------------------------------------------------
     商品列表
     --------------------------------------------------------------------- */
  function visibleProducts() {
    if (state.category === '全部') return products;
    return products.filter(function (p) { return p.category === state.category; });
  }

  function renderGrid() {
    var grid = $('product-grid');
    var list = visibleProducts();

    $('result-count').textContent = list.length + ' 款';

    if (!list.length) {
      grid.innerHTML =
        '<div class="empty">' +
        '<svg class="icon" aria-hidden="true" style="width:2rem;height:2rem;margin:0 auto .5rem"><use href="#i-box"></use></svg>' +
        '<p>這個分類今天沒有出爐，換一個分類看看。</p></div>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      return '' +
        '<article class="card">' +
          '<button type="button" class="card__media" data-open="' + p.id + '" aria-label="查看 ' + p.name + '">' +
            '<img src="' + p.remote + '" data-fallback="' + p.local + '" alt="' + p.name + '" loading="lazy" decoding="async">' +
            '<span class="card__cat">' + p.category + '</span>' +
            '<span class="tag card__tag">' + money(p.price) + '</span>' +
          '</button>' +
          '<div class="card__body">' +
            '<button type="button" class="card__name" data-open="' + p.id + '">' + p.name + '</button>' +
            '<p class="card__desc">' + p.desc + '</p>' +
            '<div class="card__actions">' +
              '<button type="button" class="btn btn--quiet" data-open="' + p.id + '">看詳細</button>' +
              '<button type="button" class="btn btn--primary btn--icon" data-add="' + p.id + '" aria-label="把 ' + p.name + ' 加入購物車">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-cart-plus"></use></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');

    watchImages(grid);
  }

  /* ---------------------------------------------------------------------
     對話框開關（原生 <dialog>，鍵盤與 ESC 由瀏覽器處理）
     --------------------------------------------------------------------- */
  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  }

  function closeDialog(dialog) {
    if (dialog.open) dialog.close();
  }

  function wireDialog(dialog) {
    dialog.addEventListener('close', function () {
      document.documentElement.style.overflow = '';
    });
    /* 點擊底色（對話框本體，非面板）即關閉 */
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.classList.contains('sheet__positioner')) closeDialog(dialog);
    });
    dialog.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeDialog(dialog); });
    });
  }

  /* ---------------------------------------------------------------------
     商品詳情
     --------------------------------------------------------------------- */
  function openProduct(id) {
    var p = products.find(function (item) { return item.id === id; });
    if (!p) return;

    window.Analytics.viewItem(p);

    var body = $('detail-body');
    body.innerHTML = '' +
      '<img class="detail__img" src="' + p.remote + '" data-fallback="' + p.local + '" alt="' + p.name + '">' +
      '<div class="detail__body">' +
        '<div class="detail__row">' +
          '<h2 id="detail-title">' + p.name + '</h2>' +
          '<span class="tag tag--lg tag--accent">' + money(p.price) + '</span>' +
        '</div>' +
        '<p class="detail__meta">' + p.category + '．' + p.note + '</p>' +
        '<p class="detail__desc">' + p.desc + '</p>' +
        '<button type="button" class="btn btn--primary btn--block" data-add="' + p.id + '" data-then="close">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-cart-plus"></use></svg>加入購物車</button>' +
      '</div>';

    watchImages(body);
    openDialog($('detail-dialog'));
  }

  /* ---------------------------------------------------------------------
     購物車操作
     --------------------------------------------------------------------- */
  function addToCart(id) {
    var p = products.find(function (item) { return item.id === id; });
    if (!p) return;

    var line = state.cart.find(function (item) { return item.id === id; });
    if (line) {
      line.quantity += 1;
    } else {
      state.cart.push({
        id: p.id, name: p.name, price: p.price, category: p.category,
        local: p.local, remote: p.remote, quantity: 1
      });
    }

    window.Analytics.addToCart(p, 1);
    saveCart();
    syncCartUI();
    bumpBadge();
    toast(p.name + ' 已加入購物車');
  }

  function changeQuantity(id, delta) {
    var index = state.cart.findIndex(function (item) { return item.id === id; });
    if (index === -1) return;
    var line = state.cart[index];

    if (delta > 0) {
      line.quantity += 1;
      window.Analytics.addToCart(line, 1);
    } else {
      window.Analytics.removeFromCart(line, 1);
      line.quantity -= 1;
      if (line.quantity <= 0) state.cart.splice(index, 1);
    }

    saveCart();
    syncCartUI();
    renderCart();
  }

  function removeLine(id) {
    var index = state.cart.findIndex(function (item) { return item.id === id; });
    if (index === -1) return;
    var line = state.cart[index];
    window.Analytics.removeFromCart(line, line.quantity);
    state.cart.splice(index, 1);
    saveCart();
    syncCartUI();
    renderCart();
    toast(line.name + ' 已移除', 'warn');
  }

  function renderCart() {
    var body = $('cart-body');

    if (!state.cart.length) {
      body.innerHTML =
        '<div class="empty">' +
        '<svg class="icon" aria-hidden="true" style="width:2rem;height:2rem;margin:0 auto .5rem"><use href="#i-box"></use></svg>' +
        '<p>購物車還是空的。</p>' +
        '<p class="detail__meta">回到糖果櫃挑一款帶走。</p></div>';
    } else {
      body.innerHTML = '<div class="line-items">' + state.cart.map(function (item) {
        return '' +
          '<div class="line">' +
            '<img src="' + item.remote + '" data-fallback="' + item.local + '" alt="">' +
            '<div>' +
              '<div class="line__name">' + item.name + '</div>' +
              '<div class="line__price">' + money(item.price) + ' × ' + item.quantity +
                ' ＝ ' + money(item.price * item.quantity) + '</div>' +
            '</div>' +
            '<div class="qty">' +
              /* 只剩一件時，減號直接變成移除，省下一顆按鈕的寬度 */
              (item.quantity > 1
                ? '<button type="button" data-qty="-1" data-id="' + item.id + '" aria-label="減少 ' + item.name + ' 的數量">' +
                    '<svg class="icon" aria-hidden="true"><use href="#i-minus"></use></svg></button>'
                : '<button type="button" data-remove="' + item.id + '" aria-label="移除 ' + item.name + '">' +
                    '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg></button>') +
              '<output aria-label="' + item.name + ' 的數量">' + item.quantity + '</output>' +
              '<button type="button" data-qty="1" data-id="' + item.id + '" aria-label="增加 ' + item.name + ' 的數量">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
            '</div>' +
          '</div>';
      }).join('') + '</div>';
      watchImages(body);
    }

    $('cart-total').textContent = money(cartTotal());
    $('checkout-btn').disabled = state.cart.length === 0;
  }

  function openCart() {
    window.Analytics.viewCart(state.cart);
    renderCart();
    openDialog($('cart-dialog'));
  }

  /* ---------------------------------------------------------------------
     徽章、底部購物列
     --------------------------------------------------------------------- */
  function bumpBadge() {
    var badge = $('cart-count');
    badge.classList.add('is-bumped');
    setTimeout(function () { badge.classList.remove('is-bumped'); }, 200);
  }

  function syncCartUI() {
    var count = cartCount();
    var badge = $('cart-count');

    badge.textContent = count;
    badge.hidden = count === 0;

    $('dock-meta').textContent = '購物車 ' + count + ' 件';
    $('dock-total').textContent = money(cartTotal());
    $('dock').classList.toggle('is-open', count > 0);
    document.body.classList.toggle('has-dock', count > 0);
  }

  /* ---------------------------------------------------------------------
     結帳
     --------------------------------------------------------------------- */
  function startCheckout() {
    if (!state.cart.length) return;
    window.Analytics.beginCheckout(state.cart);
    closeDialog($('cart-dialog'));

    $('checkout-step-form').hidden = false;
    $('checkout-step-done').hidden = true;
    $('pay-error').textContent = '';
    openDialog($('checkout-dialog'));
  }

  function digits(value) { return value.replace(/\D/g, ''); }

  function validatePayment(form) {
    var number = digits(form.cardNumber.value);
    var exp = form.cardExp.value.trim();
    var cvc = digits(form.cardCvc.value);

    if (number.length < 13) return '卡號至少 13 碼，請再確認一次。';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return '有效期限請填 MM/YY，例如 08/28。';
    if (cvc.length < 3) return '安全碼是卡片背面的 3 到 4 碼數字。';
    return '';
  }

  function submitPayment(e) {
    e.preventDefault();
    var form = e.target;
    var error = validatePayment(form);

    if (error) {
      $('pay-error').textContent = error;
      return;
    }
    $('pay-error').textContent = '';

    window.Analytics.addPaymentInfo(state.cart);

    var btn = $('pay-btn');
    var label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = '處理中…';

    setTimeout(function () {
      var orderId = 'T' + Date.now();
      window.Analytics.purchase(state.cart, orderId);

      /* 交給 orders.js 寫入 Supabase；離線時它會自己排隊 */
      document.dispatchEvent(new CustomEvent('sweet-time:purchase', {
        detail: {
          orderId: orderId,
          currency: 'TWD',
          total: cartTotal(),
          status: 'paid',
          placedAt: new Date().toISOString(),
          items: state.cart.map(function (i) {
            return { id: i.id, name: i.name, category: i.category, price: i.price, quantity: i.quantity };
          })
        }
      }));

      $('order-id').textContent = '訂單編號 ' + orderId;
      $('checkout-step-form').hidden = true;
      $('checkout-step-done').hidden = false;

      state.cart = [];
      saveCart();
      syncCartUI();

      btn.disabled = false;
      btn.innerHTML = label;
      form.reset();
    }, 1200);
  }

  /* ---------------------------------------------------------------------
     Toast
     --------------------------------------------------------------------- */
  var toastTimer;
  function toast(message, kind) {
    var el = $('toast');
    var icon = { ok: '#i-check', warn: '#i-trash', error: '#i-offline' }[kind || 'ok'] || '#i-check';

    $('toast-msg').textContent = message;
    $('toast-icon').firstElementChild.setAttribute('href', icon);
    el.className = 'toast is-visible toast--' + (kind || 'ok');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2800);
  }
  window.SweetToast = toast;

  /* ---------------------------------------------------------------------
     事件綁定
     --------------------------------------------------------------------- */
  function bind() {
    /* 商品卡片與詳情內的按鈕，統一用事件委派 */
    document.addEventListener('click', function (e) {
      var open = e.target.closest('[data-open]');
      if (open) { openProduct(open.dataset.open); return; }

      var add = e.target.closest('[data-add]');
      if (add) {
        addToCart(add.dataset.add);
        if (add.dataset.then === 'close') closeDialog($('detail-dialog'));
        return;
      }

      var qty = e.target.closest('[data-qty]');
      if (qty) { changeQuantity(qty.dataset.id, Number(qty.dataset.qty)); return; }

      var remove = e.target.closest('[data-remove]');
      if (remove) { removeLine(remove.dataset.remove); return; }

      var chip = e.target.closest('[data-cat]');
      if (chip) {
        state.category = chip.dataset.cat;
        renderFilters();
        renderGrid();
      }
    });

    $('cart-btn').addEventListener('click', openCart);
    $('hero-cart-btn').addEventListener('click', openCart);
    $('dock-btn').addEventListener('click', openCart);
    $('checkout-btn').addEventListener('click', startCheckout);
    $('payment-form').addEventListener('submit', submitPayment);
    $('continue-btn').addEventListener('click', function () {
      closeDialog($('checkout-dialog'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* 卡號、期限自動分隔，手機上少按幾次 */
    $('card-number').addEventListener('input', function (e) {
      e.target.value = digits(e.target.value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    });
    $('card-exp').addEventListener('input', function (e) {
      var v = digits(e.target.value).slice(0, 4);
      e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
    });

    ['detail-dialog', 'cart-dialog', 'checkout-dialog'].forEach(function (id) {
      wireDialog($(id));
    });
  }

  /* ---------------------------------------------------------------------
     啟動
     --------------------------------------------------------------------- */
  renderHero();
  renderFilters();
  renderGrid();
  syncCartUI();
  bind();
})();
