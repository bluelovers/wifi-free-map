# AGENTS.md

## 專案概述
免費 WiFi 與充電設施地圖服務，基於 Next.js，使用 React、Leaflet，資料來自台灣政府開放平台（透過 `scripts/sync-data.ts` 同步）。

## 核心命令（避免猜測錯誤）
- 安裝依賴：`pnpm install`
- 開發伺服器：`pnpm run dev`
- 資料構建（專案特定）：`pnpm run build:data:all`（依序執行原始資料轉換、WiFi/充電網格分割、網格索引生成）

## Git 操作規範

**禁止主動操作 Git 相關行為**
- 除非明確指示，否則不要執行 `git commit`、`git push`、`git pull`、`git merge` 等操作
- 不要主動建議提交，除非使用者明確要求
- 不要主動建立分支、切換分支

**除非有需要比對歷史來比較變化，否則非必要請不要一直操作 GIT**

## 架構與工具鏈
- **ES 模組專案**：`package.json` 設置 `"type": "module"`，執行 TypeScript 腳本用 `tsx`（如 `tsx scripts/convert-raw.ts`）
- **測試配置**：Jest 配置文件 `jest.config.cjs`，因 ES 模組啟用 `extensionsToTreatAsEsm` 和 ts-jest 的 `useESM: true`，測試環境為 `node`，測試檔案匹配 `test/**/*.test.ts(x)`
- **TypeScript 配置**：`tsconfig.json` 使用 Next.js 插件，`paths` 映射 `@/*` 到 `src/*`

## 測試注意事項
- 測試夾具位於 `test/fixtures/`

## 測試與除錯

- **使用 Chrome DevTools**：可以使用 `chrome-devtools` 工具察看待測網站來除錯或測試操作網站內容
- **測試伺服器開啟方式**：請使用 Chrome DevTools 開啟 `https://192.168.0.66:3000/` 來操作瀏覽器做測試或除錯，不需要執行任何編譯或 typecheck
- **禁止自動開啟伺服器**：除非使用者明確要求，否則不允許執行 `pnpm run dev` 來自行開啟測試伺服器
- **處理無法連線**：如果測試網址無法連線，代表可能沒有執行 `dev` 指令或 `dev` 啟動失敗
- **開發伺服器 Hot Reload**：開發伺服器基本上有 hot reload 功能，不需要主動重啟
- **謹慎請求重啟**：如果確定更改無誤，卻又看不見變化或修正問題，可以請示使用者重啟伺服器
- **主動排查問題**：代理應自行查看測試伺服器、自行檢查 console 訊息、自行排查，無法做到時才請求使用者協助
- **主動完成任務**：當知道要做什麼的時候，應該要自己主動去完成，而不是要求使用者去處理（例如：請使用者重新整理頁面、請使用者檢查 console）

## 參考文件
- `README.md`：資料來源與授權說明
- 無其他 AI 指導文件（CLAUDE.md、.cursorrules 等不存在）
