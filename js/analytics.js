/* 甜蜜時光 — GA4 電子商務事件
   原本的 7 個事件全數保留。離線時 gtag 會把事件排入 dataLayer，
   恢復連線後 gtag.js 載入即補送，所以這裡不需要額外處理佇列。 */

(function (global) {
  'use strict';

  var CURRENCY = 'TWD';

  function send(name, params) {
    if (typeof global.gtag === 'function') {
      global.gtag('event', name, params);
    }
    if (global.console && console.debug) {
      console.debug('[GA4]', name, params);
    }
  }

  function toItem(source, quantity) {
    return {
      item_id: source.id,
      item_name: source.name,
      item_category: source.category,
      price: source.price,
      quantity: quantity || source.quantity || 1
    };
  }

  function fromCart(cart) {
    return cart.map(function (item) { return toItem(item, item.quantity); });
  }

  function cartValue(cart) {
    return cart.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
  }

  global.Analytics = {
    /* 1. 查看商品 */
    viewItem: function (product) {
      send('view_item', { currency: CURRENCY, value: product.price, items: [toItem(product, 1)] });
    },
    /* 2. 加入購物車 */
    addToCart: function (product, quantity) {
      var qty = quantity || 1;
      send('add_to_cart', {
        currency: CURRENCY,
        value: product.price * qty,
        items: [toItem(product, qty)]
      });
    },
    /* 3. 查看購物車 */
    viewCart: function (cart) {
      send('view_cart', { currency: CURRENCY, value: cartValue(cart), items: fromCart(cart) });
    },
    /* 4. 從購物車移除 */
    removeFromCart: function (item, quantity) {
      var qty = quantity || item.quantity || 1;
      send('remove_from_cart', {
        currency: CURRENCY,
        value: item.price * qty,
        items: [toItem(item, qty)]
      });
    },
    /* 5. 開始結帳 */
    beginCheckout: function (cart) {
      send('begin_checkout', { currency: CURRENCY, value: cartValue(cart), items: fromCart(cart) });
    },
    /* 6. 填寫付款資訊 */
    addPaymentInfo: function (cart) {
      send('add_payment_info', {
        currency: CURRENCY,
        value: cartValue(cart),
        payment_type: 'Credit Card',
        items: fromCart(cart)
      });
    },
    /* 7. 完成購買 */
    purchase: function (cart, transactionId) {
      send('purchase', {
        transaction_id: transactionId,
        currency: CURRENCY,
        value: cartValue(cart),
        items: fromCart(cart)
      });
    },

    /* PWA 專屬事件：安裝提示、安裝完成、離線瀏覽 */
    pwa: function (action, detail) {
      send('pwa_' + action, detail || {});
    }
  };
})(window);
