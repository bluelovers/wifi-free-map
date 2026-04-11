## 1. 建立共用模組

- [x] 1.1 建立 `scripts/utils/` 目錄
- [x] 1.2 建立 `scripts/utils/grid-utils.ts` 檔案
- [x] 1.3 匯出 `BLOCK_SIZE` 常數
- [x] 1.4 匯出 `TAIWAN_BOUNDS` 常數
- [x] 1.5 匯出 `getBlockIndex()` 函式
- [x] 1.6 匯出 `getBlockCenter()` 函式
- [x] 1.7 匯出 `getBlockBounds()` 函式
- [x] 1.8 匯出統一的 `extractLocationInfo()` 函式（採用 charging 版本實作）

## 2. 重構 split-grid-wifi.ts

- [x] 2.1 移除 `BLOCK_SIZE` 常數定義，改為從 `grid-utils` 匯入
- [x] 2.2 移除 `TAIWAN_BOUNDS` 常數定義，改為從 `grid-utils` 匯入
- [x] 2.3 移除 `getBlockIndex()` 函式，改為從 `grid-utils` 匯入
- [x] 2.4 移除 `getBlockCenter()` 函式，改為從 `grid-utils` 匯入
- [x] 2.5 移除 `getBlockBounds()` 函式，改為從 `grid-utils` 匯入
- [x] 2.6 移除 `extractLocationInfo()` 函式，改為從 `grid-utils` 匯入

## 3. 重構 split-grid-charging.ts

- [x] 3.1 移除 `BLOCK_SIZE` 常數定義，改為從 `grid-utils` 匯入
- [x] 3.2 移除 `TAIWAN_BOUNDS` 常數定義，改為從 `grid-utils` 匯入
- [x] 3.3 移除 `getBlockIndex()` 函式，改為從 `grid-utils` 匯入
- [x] 3.4 移除 `getBlockCenter()` 函式，改為從 `grid-utils` 匯入
- [x] 3.5 移除 `getBlockBounds()` 函式，改為從 `grid-utils` 匯入
- [x] 3.6 移除 `extractLocationInfo()` 函式，改為從 `grid-utils` 匯入

## 4. 驗證重構

- [x] 4.1 執行 TypeScript 編譯確認無錯誤
- [x] 4.2 執行 `split-grid-wifi.ts` 確認輸出格式與重構前相同
- [x] 4.3 執行 `split-grid-charging.ts` 確認輸出格式與重構前相同
- [x] 4.4 比對 `public/data/grid-index.json` 確認內容未變動
