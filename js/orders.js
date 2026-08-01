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

/* --- 寫入一筆訂單 ---
   欄位名稱對齊資料表 schema。若日後改表，改這裡即可。 */
async function saveOrder(order) {
  const { error } = await supabase.from(ORDERS_TABLE).insert({
    customer_name:    order.customer.name,
    customer_phone:   order.customer.phone,
    customer_address: order.customer.address,
    remittance_last5: order.customer.bankLast5,
    items:            order.items,
    total_amount:     order.total,
    status:           order.status
    // id 與 created_at 由資料表自動產生，不需傳
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
