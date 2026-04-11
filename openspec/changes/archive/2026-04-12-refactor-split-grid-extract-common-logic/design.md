## Context

現有 `scripts/split-grid-wifi.ts` 和 `scripts/split-grid-charging.ts` 兩個腳本用於將 Wi-Fi 熱點和充電站資料依地圖區塊切割。兩個檔案包含幾乎相同的邏輯：

**重複內容:**
- `BLOCK_SIZE = 0.0306959` 常數
- `TAIWAN_BOUNDS` 座標範圍物件
- `getBlockIndex()` 區塊索引計算
- `getBlockCenter()` 區塊中心點計算
- `getBlockBounds()` 區塊邊界計算
- `extractLocationInfo()` 地址解析（兩個版本略有不同）

這導致:
1. 修改區塊大小時需同步更新多個檔案
2. 地址解析邏輯不一致（charging 版本多了 `cleanAddress` 處理）
3. 新增其他類型資料（如公廁、停車場）時需複製重複程式碼

## Goals / Non-Goals

**Goals:**
- 建立共用的 `grid-utils.ts` 模組
- 統一地址解析邏輯至單一實作
- 消除程式碼重複，提高可維護性
- 為未來新增其他資料類型提供擴展基礎

**Non-Goals:**
- 不變更現有輸出資料格式
- 不變更現有腳本的執行邏輯（僅重構）
- 不新增任何新功能或改變行為

## Decisions

### Decision 1: 建立 `scripts/utils/grid-utils.ts` 共用模組

**選擇:** 建立 `scripts/utils/` 目錄放置共用工具模組

**理由:**
- 符合 Node.js 慣例，`utils` 目錄用於存放通用工具函式
- 與 `scripts/` 下的具體業務邏輯腳本分離
- 未來可持續擴展其他共用工具

**替代方案考慮:**
- `scripts/shared/` → 與其他腳本同層，語意不如 `utils` 明確
- 直接在 `scripts/` 根目錄 → 造成根目錄檔案過多

### Decision 2: 統一 `extractLocationInfo()` 實作

**選擇:** 採用 charging 版本的實作（包含 `cleanAddress` 處理），並確保 wifi 版本也使用相同的清理邏輯

**理由:**
- charging 版本多了 `\n` 換行符號清理，更加健壯
- wifi 版本缺少此處理，可能在特殊情況下出錯
- 統一後可避免日後維護兩套邏輯

**替代方案考慮:**
- 各自保留差異 → 違背重構目標
- 只保留 charging 版本 → 可能影響現有 wifi 資料處理

### Decision 3: 維持 TypeScript 匯出格式

**選擇:** 使用 named exports 匯出所有函式與常數

**理由:**
- 允許按需匯入，降低打包體積
- 與現有 ESM 專案結構一致
- 方便未來測試（可單獨測試每個函式）

## Risks / Trade-offs

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| 重構後行為不一致 | 高 | 執行重構後比對輸出 JSON 與原始版本完全相同 |
| 現有資料格式變動 | 中 | 使用 snapshot testing 或手動比對 |
| 部署失敗需回滾 | 低 | 保留原始檔案副本至實作完成確認無誤 |

## Open Questions

- 是否需要為 `grid-utils.ts` 建立單元測試？
- 是否要建立 `scripts/utils/index.ts` 統一匯出？
