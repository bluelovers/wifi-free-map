# WiFi Free Map - 免費 WiFi 與充電設施地圖服務

## 1. 專案概述 (Project Overview)

### 專案名稱
**WiFi Free Map** - 免費 WiFi 與充電設施查找地圖

### 專案類型
Web 應用程式 (Next.js PWA)

### 核心功能摘要
一款讓使用者能夠在地圖上查看附近免費 WiFi 熱點、充電設施（USB/插座）的地圖服務，支援離線查詢、GPS 定位、WiFi 輔助偵測、QR Code 連線與用戶貢獻功能。

### 目標使用者
- 旅行者與背包客
- 遠距工作者
- 需要緊急上網的民眾
- 電動車/手機需要充電的使用者

---

## 2. 功能規格 (Feature Specification)

### 2.1 地圖功能

| 功能 | 描述 | 優先級 |
|------|------|--------|
| 地圖顯示 | 使用 Leaflet.js + OpenStreetMap 顯示互動式地圖 | 必備 |
| 離線地圖緩存 | 支援瀏覽後自動緩存地圖圖塊以便離線使用 | 必備 |
| 離線資料查詢 | Service Worker 快取熱點資料，支援離線查詢 | 必備 |
| 圖層切換 | 可切換顯示 WiFi 熱點、充電設施、EV 充電樁圖層 | 必備 |
| 標記顯示 | 自定義圖示區分不同設施類型 | 必備 |

### 2.2 定位功能

| 功能 | 描述 | 優先級 |
|------|------|--------|
| GPS 定位 | 使用瀏覽器 Geolocation API 取得当前位置 | 必備 |
| WiFi 輔助定位 | 根據可用 WiFi SSID 輔助偵測位置（需用戶授權） | 可選 |
| 距離排序 | 根據使用者位置排序顯示最近設施 | 必備 |
| 導航連結 | 開啟手機導航 App（Google Maps/Apple Maps） | 必備 |

### 2.3 WiFi 熱點功能

| 功能 | 描述 | 優先級 |
|------|------|--------|
| 熱點列表顯示 | 顯示附近 WiFi 熱點（名稱、位置、提供者） | 必備 |
| SSID 顯示 | 顯示 WiFi 名稱 | 必備 |
| 密碼顯示 | 顯示 WiFi 密碼（用戶貢獻的熱點） | 可選 |
| QR Code 生成 | 自動生成 WiFi 連線 QR Code | 必備 |
| WiFi 連線連結 | 生成 Android/iOS 專用 WiFi 連線連結 | 必備 |
| 多熱點支援 | 同一地點可有多個 WiFi 熱點 | 必備 |
| 熱點詳情頁 | 顯示熱點詳細資訊與操作選項 | 必備 |

### 2.4 資料來源整合

| 資料來源 | 描述 | 優先級 |
|------|------|--------|
| iTaiwan WiFi | 政府資料集 - https://data.gov.tw/dataset/5962 | 必備 |
| 用戶貢獻 | 用戶自行新增的 WiFi 熱點 | 必備 |
| OSM 充電設施 | OpenStreetMap - amenity=charging_station, socket=* | 必備 |
| OSM USB/插座 | OpenStreetMap - socket:USB=*, socket=* | 必備 |
| EV 充電樁 | 交通部 API - https://data.gov.tw/dataset/170220 | 可選 |

### 2.5 用戶貢獻系統

| 功能 | 描述 | 優先級 |
|------|------|--------|
| 新增熱點 | 用戶可自行新增 WiFi 熱點資訊 | 必備 |
| 編輯熱點 | 允許用戶編輯現有熱點資訊 | 可選 |
| 熱點驗證 | 熱點經其他用戶驗證後確認 | 可選 |
| 貢獻者列表 | 顯示貢獻者名稱（可匿名） | 可選 |

### 2.6 離線功能

| 功能 | 描述 | 優先級 |
|------|------|--------|
| PWA 支援 | 安裝為離線應用程式 | 必備 |
| Service Worker | 快取靜態資源與 API 回應 | 必備 |
| IndexedDB 儲存 | 本地儲存熱點資料 | 必備 |
| 離線地圖圖塊 | 自動下載並快取瀏覽過的區域地圖 | 必備 |

### 2.7 搜尋與篩選

| 功能 | 描述 | 優先級 |
|------|------|--------|
| 關鍵字搜尋 | 搜尋熱點名稱或地址 | 必備 |
| 類型篩選 | 篩選 WiFi/USB/插座/EV 充電樁 | 必備 |
| 距離範圍 | 設定顯示範圍（500m, 1km, 5km） | 必備 |
| 顯示密碼篩選 | 篩選需要密碼或免費的熱點 | 可選 |

---

## 3. 技術架構 (Technical Architecture)

### 3.1 前端技術堆疊

| 技術 | 用途 |
|------|------|
| Next.js 14+ | React 框架 (App Router) |
| TypeScript | 類型安全 |
| Leaflet.js | 地圖顯示 |
| react-leaflet | React Leaflet 整合 |
| PWA | 離線支援 (next-pwa) |
| IndexedDB (idb) | 本地資料儲存 |
| qrcode | QR Code 生成 |
| workbox | Service Worker 與離線策略 |

### 3.2 資料儲存

| 儲存類型 | 用途 |
|------|------|
| API 回應快取 | 熱點資料 API _response 快取 |
| IndexedDB | 本地熱點資料儲存 |
| Service Worker | 地圖圖塊與靜態資源快取 |
| LocalStorage | 使用者偏好設定 |

### 3.3 資料模型

```typescript
// WiFi 熱點
interface IWiFiHotspot {
  id: string;
  source: 'itaiwan' | 'user_contributed';
  name: string;           // 地點名稱
  ssid: string;           // WiFi SSID
  password?: string;      // WiFi 密碼（用戶貢獻）
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  provider: string;        // 業者/場所
  isFree: boolean;        // 是否免費
  isOpen: boolean;        // 營業中
  openTime?: string;      // 開放時間
  createdAt: Date;
  createdBy: string;
  verified: boolean;
}

// 充電設施
interface IChargingStation {
  id: string;
  source: 'osm' | 'ev_api' | 'user_contributed';
  type: 'usb' | 'outlet' | 'wireless' | 'ev';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  name: string;
  details?: string;
  socketTypes?: string[];
  isFree: boolean;
  openingHours?: string;
}
```

### 3.4 API 端點設計

| 方法 | 路徑 | 描述 |
|------|------|------|
| GET | /api/hotspots | 取得熱點列表（支援篩選） |
| GET | /api/hotspots/[id] | 取得單一熱點詳情 |
| POST | /api/hotspots | 新增熱點（用戶貢獻） |
| GET | /api/charging | 取得充電設施列表 |
| GET | /api/geocode | 地址座標轉換 |

---

## 4. UI/UX 設計方向

### 4.1 整體視覺風格
- 現代化、清新、使用者友善
- 響應式設計（支援手機與桌面）
- 以地圖為主體，側邊欄/底部抽屜顯示清單

### 4.2 色彩方案

| 用途 | 色彩 |
|------|------|
| 主色 | #2196F3 (藍色 - 科技感) |
| 次色 | #4CAF50 (綠色 - 免費/環保) |
| 強調色 | #FF9800 (橘色 - 充電) |
| 背景 | #FAFAFA |
| 深色模式 | #121212 |

### 4.3 圖示設計

| 設施類型 | 圖示顏色 |
|------|------|
| iTaiwan WiFi | 藍色 |
| 用戶貢獻 WiFi | 綠色 |
| USB 充電 | 橘色 |
| 插座/一般充電 | 黃色 |
| EV 充電樁 | 紫色 |

### 4.4 主要頁面布局

1. **首頁/地圖頁面**
   - 全螢幕地圖
   - 浮動搜尋列
   - 底部設施清單抽屜
   - 右側圖層篩選按鈕
   - GPS 定位按鈕

2. **熱點詳情頁面**
   - 標記點擊彈出視窗 (Popup)
   - 顯示名稱、SSID、密碼、QR Code
   - 導航按鈕
   - 分享按鈕

3. **貢獻頁面**
   - 新增熱點表單
   - 地圖選擇位置
   - SSID/密碼輸入

---

## 5. 實作里程碑

### Phase 1: 基礎建設
- [ ] Next.js 專案初始化
- [ ] Leaflet 地圖整合
- [ ] 基礎 UI 組件

### Phase 2: 資料整合
- [ ] iTaiwan WiFi 資料集整合
- [ ] OSM 充電設施資料獲取
- [ ] API 端點實作

### Phase 3: 核心功能
- [ ] 熱點列表與篩選
- [ ] GPS 定位
- [ ] QR Code 生成
- [ ] WiFi 連線連結

### Phase 4: 離線支援
- [ ] PWA 設定
- [ ] Service Worker
- [ ] IndexedDB 整合
- [ ] 地圖圖塊離線緩存

### Phase 5: 用戶貢獻
- [ ] 新增熱點表單
- [ ] 貢獻資料儲存
- [ ] 基本驗證系統

---

## 6. 已知限制與解決方案

| 限制 | 解決方案 |
|------|------|
| 無統一公共充電資料集 | 優先使用 OSM 資料，用戶可補充 |
| 離線地圖需要大量儲存 | 限制離線區域大小，提供手動下載特定區域 |
| GPS 在室內可能不準 | 提供手動輸入位置或 WiFi 輔助定位 |
| iTaiwan 資料可能過時 | 定期更新 + 用戶回報修正 |

---

## 7. 驗收標準

- [ ] 地圖能正確顯示並響應操作
- [ ] 能取得用戶 GPS 位置並顯示
- [ ] iTaiwan WiFi 熱點能正確顯示在地圖上
- [ ] 點擊熱點能顯示詳情（名稱、SSID、位置）
- [ ] 能生成 WiFi QR Code
- [ ] 能生成 WiFi 連線連結 (Android/iOS)
- [ ] 能開啟導航功能
- [ ] PWA 能正確安裝
- [ ] 離線時能查看已快取的熱點資料
- [ ] 能新增用戶貢獻的 WiFi 熱點
