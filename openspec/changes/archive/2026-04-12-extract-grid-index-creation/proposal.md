## Why

現有 `grid-index.json` 的格式將 Wi-Fi 和充電站視為獨立的索引陣列，這導致：
1. 同一個區塊會出現多次（每種資料類型一次）
2. 位置資訊 (`locations`) 在不同資料類型間重複
3. 前端需要分別處理不同資料類型的請求

新的格式以**區塊為中心**，將同一區塊內的所有資料類型統一管理，更符合地圖應用的實際使用情境。

## What Changes

- **BREAKING**: 變更 `grid-index.json` 的資料結構格式
- 建立 `scripts/utils/grid-index-builder.ts` 共用模組
- 更新 `split-grid-wifi.ts` 和 `split-grid-charging.ts` 使用新的索引建立邏輯
- 統一資料寫入流程

## Capabilities

### New Capabilities

- `grid-index-builder`: 共用區塊索引建立器，包含：
  - `IGridBlock` 介面（新格式）
  - `createBlockAggregator()`: 建立區塊聚合器，支援多資料類型
  - `buildUnifiedIndex()`: 建立統一格式的索引表

### Modified Capabilities

<!-- 本變更不涉及現有功能的需求變更 -->

## Impact

- **受影響檔案**:
  - `public/data/grid-index.json` - **BREAKING** 格式變更
  - `scripts/split-grid-wifi.ts`
  - `scripts/split-grid-charging.ts`
  - 新增: `scripts/utils/grid-index-builder.ts`
- **依賴變更**: 無新增外部依賴
- **API 變更**: `grid-index.json` 結構完全重構
