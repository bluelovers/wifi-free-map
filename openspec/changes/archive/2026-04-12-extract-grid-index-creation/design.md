## Context

經過上一輪重構，`scripts/utils/grid-utils.ts` 已包含共用的座標計算與地址解析函式。然而現有的 `grid-index.json` 格式存在設計問題：

**現有格式問題:**
```json
[
  { "fileName": "...", "type": "wifi", ... },
  { "fileName": "...", "type": "charging", ... }
]
```

- 同一個地理區塊可能出現多次（每種資料類型一次）
- `locations` 在不同資料類型間重複
- 前端需要合併處理不同資料類型

**新格式設計:**
```json
[
  {
    "fileName": "120.4819_26.3694.json",
    "center": { "lat": 26.369379, "lng": 120.48187 },
    "bounds": { ... },
    "dataset": {
      "wifi": { "fileName": "grid-wifi/120.4819_26.3694.json", "count": 14 },
      "charging": { "fileName": "grid-charging/120.4819_26.3694.json", "count": 5 }
    },
    "locations": ["108臺北市萬華區", "108臺北市萬華區XX路"]
  }
]
```

## Goals / Non-Goals

**Goals:**
- 將 `grid-index.json` 改為以**區塊為中心**的統一結構
- 同一區塊內的 `locations` 只儲存一次
- `dataset` 物件包含該區塊內所有資料類型的資訊
- 支援未來擴展更多資料類型

**Non-Goals:**
- 不改變各資料類型的實際資料檔案結構
- 不改變現有腳本的業務邏輯
- 不合併 `split-grid-wifi.ts` 和 `split-grid-charging.ts` 為單一檔案

## Decisions

### Decision 1: 統一 `fileName` 格式

**選擇:** `fileName` 不帶前綴，代表區塊本身

**理由:**
- 區塊是地理單位，`fileName` 應代表區塊而非單一資料類型
- `dataset` 內的各類型有各自的路徑

### Decision 2: `dataset` 結構

**選擇:** 每個資料類型為一個鍵，值包含 `fileName` 和 `count`

**理由:**
- 可擴展：未來新增 `restroom`、`parking` 等只需新增鍵
- 每個類型可有自己的檔案路徑前綴
- 包含計數方便前端顯示

### Decision 3: 聚合器設計

**選擇:** 單一聚合器支援多資料類型，自動合併同區塊資料

**理由:**
- 避免分別建立索引再合併的複雜邏輯
- `locations` 在新增資料時自動合併（取聯集）
- 確保同一區塊只出現一次

## Risks / Trade-offs

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| **BREAKING** 格式變更 | 高 | 前端需同步更新以支援新格式 |
| 資料檔名變更 | 中 | 確認所有引用處已更新 |

## Open Questions

- 是否需要同時維護舊格式以支援漸進式遷移？
