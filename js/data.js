/* 甜蜜時光 — 商品資料
   remote：正式的商品照（外部網址，Service Worker 會做執行階段快取）
   local ：離線／載入失敗時顯示的本地插圖，確保沒有網路時版面不會開天窗 */

window.PRODUCTS = [
  {
    id: 'CANDY_001',
    name: '夢幻星空棒棒糖',
    price: 90,
    category: '棒棒糖',
    desc: '純手工熬煮的宇宙美景，包含六種不同莓果風味。',
    note: '單支 25g／可保存 6 個月',
    local: './img/candy-01.svg',
    remote: 'https://image.pollinations.ai/prompt/Handmade%20galaxy%20lollipops%20with%20edible%20glitter%20stars%20and%20swirls%2C%20rustic%20wooden%20table%2C%20vintage%20candy%20workshop%20setting%2C%20warm%20sunlight%2C%20photorealistic%20food%20photography?width=1024&height=576&nologo=true'
  },
  {
    id: 'CANDY_002',
    name: '海鹽焦糖太妃軟糖',
    price: 150,
    category: '軟糖',
    desc: '法國海鹽與醇厚焦糖的完美融合，入口即化，甜而不膩。',
    note: '每盒 12 顆／建議冷藏',
    local: './img/candy-02.svg',
    remote: 'https://image.pollinations.ai/prompt/Square%20caramel%20toffee%20candies%20sprinkled%20with%20sea%20salt%20flakes%2C%20resting%20on%20brown%20baking%20paper%2C%20rustic%20wooden%20table%2C%20warm%20sunlight%2C%20food%20photography?width=1024&height=576&nologo=true'
  },
  {
    id: 'CANDY_003',
    name: '初戀草莓硬糖',
    price: 120,
    category: '硬糖',
    desc: '採用新鮮草莓原汁製作，每一口都能嘗到酸甜的戀愛滋味。',
    note: '每袋 20 顆／無人工色素',
    local: './img/candy-03.svg',
    remote: 'https://image.pollinations.ai/prompt/Heart-shaped%20translucent%20red%20strawberry%20hard%20candies%20scattered%20on%20a%20rustic%20wooden%20table%2C%20baking%20parchment%2C%20fresh%20strawberries%2C%20handmade%20candy%20workshop%2C%20warm%20sunlight%2C%20photorealistic%20food%20photography?width=1024&height=576&nologo=true'
  },
  {
    id: 'CANDY_004',
    name: '薄荷沁涼千層糖',
    price: 110,
    category: '硬糖',
    desc: '清爽薄荷與微甜糖衣的千層交響曲，飯後解膩首選。',
    note: '每袋 18 顆／天然薄荷腦',
    local: './img/candy-04.svg',
    remote: 'https://image.pollinations.ai/prompt/Handmade%20layered%20mint%20candies%2C%20refreshing%20light%20green%20and%20white%20stripes%2C%20on%20parchment%20paper%2C%20rustic%20wooden%20table%2C%20fresh%20mint%20leaves%2C%20vintage%20candy%20workshop%2C%20warm%20sunlight%2C%20photorealistic%20food%20photography?width=1024&height=576&nologo=true'
  },
  {
    id: 'CANDY_005',
    name: '經典英式水果軟糖',
    price: 200,
    category: '軟糖',
    desc: '天然果膠製作，富含柳橙、檸檬、蘋果等多種水果風味。',
    note: '禮盒 24 顆／附提袋',
    local: './img/candy-05.svg',
    remote: 'https://image.pollinations.ai/prompt/Handmade%20colorful%20fruit%20jelly%20candies%2C%20dusted%20with%20sugar%2C%20classic%20British%20style%2C%20orange%20lemon%20apple%20flavors%2C%20on%20parchment%20paper%2C%20rustic%20wooden%20table%2C%20vintage%20candy%20workshop%20setting%2C%20glass%20jars%20in%20background%2C%20warm%20sunlight%2C%20photorealistic%20food%20photography?width=1024&height=576&nologo=true'
  },
  {
    id: 'CANDY_006',
    name: '玫瑰花瓣黑糖塊',
    price: 180,
    category: '黑糖',
    desc: '養生黑糖結合有機玫瑰花瓣，暖心又暖胃。',
    note: '每包 10 塊／熱水沖泡',
    local: './img/candy-06.svg',
    remote: 'https://image.pollinations.ai/prompt/Handmade%20rustic%20brown%20sugar%20cubes%20with%20dried%20rose%20petals%2C%20on%20parchment%20paper%2C%20rustic%20wooden%20table%2C%20dried%20rose%20flowers%2C%20vintage%20candy%20workshop%20setting%2C%20warm%20sunlight%2C%20photorealistic%20food%20photography?width=1024&height=576&nologo=true'
  }
];
