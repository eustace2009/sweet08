# 甜蜜時光 — RWD + PWA 版

原本的單檔 `demo.html` 已拆成可部署的靜態網站，具備完整響應式版面與 PWA（可安裝、可離線）能力。
所有 GA4 電子商務事件（7 個）維持原樣，評估 ID 仍是 `G-JQEE2PLNR8`。

---

## 檔案結構

```
sweet-time/
├── index.html                首頁（應用外殼）
├── offline.html              離線後備頁
├── manifest.webmanifest      安裝設定：名稱、圖示、啟動方式、捷徑
├── sw.js                     Service Worker：快取策略與更新流程
├── css/
│   └── styles.css            全站樣式（無框架、無 CDN）
├── js/
│   ├── data.js               商品資料
│   ├── analytics.js          GA4 事件封裝
│   ├── app.js                介面邏輯：篩選、購物車、結帳
│   ├── orders.js             Supabase 送單與離線佇列
│   └── pwa.js                SW 註冊、安裝提示、更新、連線狀態
├── icons/                    App 圖示（含 maskable 與 iOS 版本）
└── img/                      商品插圖（離線／載圖失敗時的替代圖）
```

---

## 這次改了什麼

### 1. 拿掉所有執行階段 CDN

原版依賴 `cdn.tailwindcss.com`（瀏覽器端即時編譯）與 Font Awesome CDN。
兩者都在首次繪製前阻塞，也讓「離線可用」不可能成立。現在：

| 原本 | 現在 |
| --- | --- |
| Tailwind CDN | 手寫 `css/styles.css`，用 CSS 自訂屬性當設計 token |
| Font Awesome | 內嵌 SVG sprite（`<symbol>`），只含實際用到的 12 個圖示 |
| Google Fonts 中文全套 | 標題用 Noto Serif TC，內文改用系統中文字體堆疊 |

### 2. RWD

- **流體尺度**：字級與間距用 `clamp()` 連續縮放，不靠斷點跳動。
- **商品格線**：`repeat(auto-fill, minmax(min(100%, 17rem), 1fr))`，容器多寬就排幾欄。
- **對話框雙形態**：手機是由下往上的底部抽屜（含把手），≥ 640px 變成置中卡片。
- **手機底部購物列**：購物車有東西時才滑出，總金額隨時看得到。
- **安全區域**：`viewport-fit=cover` 搭配 `env(safe-area-inset-*)`，瀏海與底部手勢條不會擋住內容。
- **分類篩選列**：手機可橫向滑動（含 scroll snap），桌機自動換行。
- **`svh` 單位**：避免手機瀏覽器網址列收合造成的高度跳動。
- **偏好設定**：支援深色模式、`prefers-reduced-motion`、`prefers-contrast`、列印樣式。
- **觸控目標**：所有可點元素高度 ≥ 44px。

### 3. PWA

| 功能 | 實作位置 |
| --- | --- |
| 可安裝 | `manifest.webmanifest`（含 maskable 圖示、App 捷徑） |
| iOS 安裝 | `apple-touch-icon` 與 `apple-mobile-web-app-*` 標籤 |
| 自訂安裝按鈕 | `js/pwa.js` 接管 `beforeinstallprompt`；iOS 改顯示操作說明 |
| 離線瀏覽 | `sw.js` 於 install 時預快取應用外殼 |
| 離線後備頁 | `offline.html` |
| 版本更新提示 | 偵測 `waiting` worker → 顯示「立即更新」→ `SKIP_WAITING` |
| 連線狀態提示 | `online` / `offline` 事件 → 頁首橫幅 |
| 購物車保存 | `localStorage`，離線整理購物車不會消失 |
| 離線送單佇列 | `js/orders.js`，恢復連線自動補送 |

**快取策略**

| 資源 | 策略 | 原因 |
| --- | --- | --- |
| 網頁導覽 | Network first → 快取 → `offline.html` | 內容以最新為準 |
| CSS / JS / 圖示 | Stale-while-revalidate | 秒開，背景更新 |
| 商品照（外部） | Cache first，上限 60 筆 | 圖檔大且不會變 |
| Google Fonts | Stale-while-revalidate（獨立快取） | 首次載入後離線也有字 |
| GA4 | Network only，離線時安靜失敗 | 不佔快取、不影響離線體驗 |
| Supabase API | 不攔截，直接走網路 | 訂單資料不該被快取 |
| supabase-js（jsDelivr） | Stale-while-revalidate | 第二次開站不必重抓 SDK |

改版時只要把 `sw.js` 最上方的 `VERSION` 換掉，舊快取會在 activate 階段自動清除。

### 4. 其他調整

- 商品照改用 `data-fallback`：外部圖載入失敗就換成本地 SVG 插圖，離線時版面不會開天窗。
- 結帳表單加了基本驗證、卡號與有效期限自動分隔、正確的 `autocomplete` 屬性（`cc-number` / `cc-exp` / `cc-csc`），手機會跳數字鍵盤。
- 對話框改用原生 `<dialog>`：焦點鎖定、Esc 關閉、背景遮罩由瀏覽器處理。
- 購物車可調整數量（原版只能整筆刪除），數量剩 1 時減號會變成移除鈕。
- 新增分類篩選、空狀態文案、`aria-live` 的結果數量提示、跳至主要內容連結。

### 5. 金鑰設定

**所有會變動的金鑰都集中在 `index.html` 最上方**，換金鑰只改這一塊，其他檔案都不用動：

```html
<!-- ============================================================
     設定區 — 要換金鑰只改這裡，其他檔案都不用動
     ============================================================ -->
<script>
  const GA4_ID       = 'G-JQEE2PLNR8';
  const SUPABASE_URL = 'https://xxxx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_xxxx';
  const ORDERS_TABLE = 'orders';
</script>
```

GA4 的 `gtag.js` 是用 `GA4_ID` 動態載入的，所以改 ID 不必再去找第二個地方改。

### 6. Supabase 訂單串接

`js/orders.js` 只做三件事：建立 client、結帳完成後寫入訂單、離線時排隊補送。

```
結帳完成
   ├─ 有網路 → 寫入 Supabase
   └─ 沒網路或失敗 → 存進本機（localStorage）
                        └─ 連線恢復 → 自動補送
```

訂單寫入 `js/orders.js` 的 `saveOrder`，欄位對齊資料表：

```sql
create table public.orders (
  id               uuid default gen_random_uuid() primary key,
  customer_name    text not null,
  customer_phone   text not null,
  customer_address text not null,
  remittance_last5 text not null,
  items            jsonb not null,
  total_amount     integer not null,
  status           text default 'pending',
  created_at       timestamptz default now()
);

alter table public.orders enable row level security;

create policy "anon can insert orders"
  on public.orders for insert to anon with check (true);
```

`id` 與 `created_at` 由資料表自動產生，前端不傳。要改欄位名就改 `saveOrder` 裡的對應。

表單四個輸入框的 `name` 屬性必須是 `name`、`phone`、`address`、`bankLast5`，
`app.js` 靠這些名稱取值——改介面時別動到。

> `sb_publishable_…` 這類金鑰本來就設計成放在前端，安全性由 RLS 決定。
> 上線前務必確認 `orders` 已啟用 RLS——**沒開 RLS 等於資料表對外全開**。


---

## 本機測試

Service Worker 只在 `https://` 或 `localhost` 下運作，直接雙擊開啟 `index.html`（`file://`）**不會**啟用 PWA 功能。

```bash
cd sweet-time
python3 -m http.server 8000
# 或：npx serve .
```

開啟 <http://localhost:8000>，然後在 Chrome DevTools：

- **Application → Manifest**：確認安裝條件都通過
- **Application → Service Workers**：勾選 Offline 後重新整理，確認離線仍可瀏覽
- **Lighthouse → Progressive Web App**：跑一次稽核
- **裝置工具列**：切換 iPhone / iPad / 桌機各尺寸檢查版面

## 部署

整包是純靜態檔案，丟到任何支援 HTTPS 的空間即可：

- **Netlify / Vercel**：直接拖曳資料夾
- **GitHub Pages**：推上 repo 後在 Settings → Pages 指定分支
- **Cloudflare Pages**：連結 repo，build command 留空，output 設為根目錄

檔案內的路徑全部是相對路徑，放在子目錄（例如 `https://user.github.io/sweet-time/`）也能正常運作。

**伺服器建議**：`sw.js` 請設定 `Cache-Control: no-cache`，避免瀏覽器拿到舊的 Service Worker 導致更新卡住。

---

## 授權與備註

- 付款流程為模擬，不會產生實際交易。
- 商品照片來自 `image.pollinations.ai` 的即時生成服務；若要正式上線，建議換成自有圖片並提供 WebP／AVIF 與 `srcset`。
