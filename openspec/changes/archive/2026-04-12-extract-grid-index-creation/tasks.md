## 1. 建立 grid-index-builder.ts 模組

- [x] 1.1 匯出 `IGridBlock`、`IBounds`、`IDatasetEntry` 介面定義
- [x] 1.2 實作 `createBlockAggregator()` 工廠函式（支援多資料類型）
- [x] 1.3 實作 `aggregator.add()` 方法（自動合併同區塊資料與 locations）
- [x] 1.4 實作 `aggregator.build()` 方法（輸出統一格式）
- [x] 1.5 實作 `mergeAggregators()` 函式（合併多個聚合器）

## 2. 重構 split-grid-wifi.ts

- [x] 2.1 匯入 `createBlockAggregator()`
- [x] 2.2 使用 aggregator 取代手動的 blockIndex Map 管理
- [x] 2.3 移除 grid-index.json 寫入邏輯
- [x] 2.4 驗證執行正確

## 3. 重構 split-grid-charging.ts

- [x] 3.1 匯入 `createBlockAggregator()`
- [x] 3.2 使用 aggregator 收集充電站資料
- [x] 3.3 移除 grid-index.json 寫入邏輯
- [x] 3.4 驗證執行正確

## 4. 建立 build-grid-index.ts 腳本

- [x] 4.1 建立獨立腳本，掃描所有資料目錄
- [x] 4.2 建立統一格式的 grid-index.json
- [x] 4.3 驗證執行正確

## 5. 驗證重構

- [x] 5.1 執行 TypeScript 編譯確認無錯誤
- [x] 5.2 執行 `split-grid-wifi.ts` 確認正確
- [x] 5.3 執行 `split-grid-charging.ts` 確認正確
- [x] 5.4 執行 `build-grid-index.ts` 確認正確
- [x] 5.5 驗證 `grid-index.json` 格式正確（統一格式）
- [x] 5.6 驗證混合區塊（同時有 wifi 和 charging）
- [x] 5.7 驗證 `locations` 不重複
