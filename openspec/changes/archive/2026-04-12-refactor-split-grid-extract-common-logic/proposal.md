## Why

`scripts/split-grid-wifi.ts` 和 `scripts/split-grid-charging.ts` 存在大量重複邏輯，包括區塊計算常數、座標計算函式、地址解析函式等。這些重複代碼導致維護困難，當需要調整區塊大小或座標範圍時，必須同步修改多個檔案，容易遺漏造成不一致。

## What Changes

- 建立 `scripts/utils/grid-utils.ts` 共用模組
- 將重複的常數與函式移至共用模組
- 更新 `split-grid-wifi.ts` 和 `split-grid-charging.ts` 使用共用模組
- 統一 `extractLocationInfo()` 函式的地址清理邏輯

## Capabilities

### New Capabilities

- `grid-calculator`: 共用地圖區塊計算工具，包含：
  - 區塊大小與座標範圍常數
  - `getBlockIndex()`: 根據座標取得區塊索引
  - `getBlockCenter()`: 計算區塊中心點座標
  - `getBlockBounds()`: 計算區塊四角座標
  - `extractLocationInfo()`: 地址解析函式（統一版本）

### Modified Capabilities

<!-- 本變更不涉及現有功能的需求變更，僅為重構 -->

## Impact

- **受影響檔案**:
  - `scripts/split-grid-wifi.ts`
  - `scripts/split-grid-charging.ts`
  - 新增: `scripts/utils/grid-utils.ts`
- **依賴變更**: 無新增外部依賴
- **API 變更**: 無（純粹重構）
