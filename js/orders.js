/* 甜蜜時光 — Supabase 送單
   ------------------------------------------------------------------
   金鑰設定在 index.html 最上方的「設定區」，這裡不需要修改。
   離線或送出失敗時，訂單會存在本機，恢復連線後自動補送。
   ------------------------------------------------------------------ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const QUEUE_KEY = 'sweet-time.pending-orders';
const toast = (msg, kind) => (window.SweetToast || (() => {}))(msg, kind);

/* --- 本機待送佇列 --- */
function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch (e) { return []; }
}
function setQueue(list) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(list)); } catch (e) { /* 無痕模式 */ }
}

/* --- 寫入一筆訂單 --- */
async function saveOrder(order) {
  const { error } = await supabase.from(ORDERS_TABLE).insert({
    order_id:  order.orderId,
    currency:  order.currency,
    total:     order.total,
    items:     order.items,
    status:    order.status,
    placed_at: order.placedAt
  });
  if (error) throw error;
}

/* --- 結帳完成 --- */
document.addEventListener('sweet-time:purchase', async (e) => {
  const order = e.detail;
  try {
    if (!navigator.onLine) throw new Error('offline');
    await saveOrder(order);
  } catch (err) {
    setQueue(getQueue().concat(order));
    console.warn('[Supabase] 訂單暫存本機：', err.message || err);
    toast('目前無法連線，訂單已存在本機，稍後自動送出', 'warn');
  }
});

/* --- 補送 --- */
async function flushQueue() {
  const list = getQueue();
  if (!list.length || !navigator.onLine) return;

  const remaining = [];
  for (const order of list) {
    try { await saveOrder(order); } catch (err) { remaining.push(order); }
  }
  setQueue(remaining);

  const sent = list.length - remaining.length;
  if (sent) toast(`已補送 ${sent} 筆訂單`);
}

window.addEventListener('online', flushQueue);
flushQueue();
