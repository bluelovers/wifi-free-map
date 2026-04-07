/**
 * 同步 iTaiwan Wi‑Fi 與公共充電站資料至 /public/data/
 * Sync iTaiwan Wi‑Fi and public charging‑station data to /public/data/.
 *
 * 此腳本會執行以下步驟：
 * 1. 下載 Wi‑Fi 資料 (Dataset 5962) 與充電站資料 (Dataset 28592)。
 * 2. 產生四個 JSON 檔案：
 *    - wifi-hotspots-raw.json（完整原始資料）
 *    - wifi-hotspots.json（過濾後、型別化的資料）
 *    - charging-stations-raw.json（完整原始資料）
 *    - charging-stations.json（過濾後、型別化的資料）
 * 3. 將檔案寫入 public/data/ 目錄。
 * 4. 使用 git add / commit / push 把變更提交至遠端，供 CI 部署。
 *
 * 此腳本設計為可本地執行（pnpm ts-node scripts/sync-data.ts）或在 CI 中呼叫。
 */

import { writeFile, mkdir } from "fs/promises";
import { resolve } from "path";
import { execSync } from "child_process";
import {
    convertWiFiArray,
    convertChargingArray,
    DEFAULT_OUTPUT_DIR,
} from "../src/lib/transform";

/**
 * iTaiwan Wi‑Fi API endpoint (Dataset 5962)
 *
 * @see https://data.gov.tw/dataset/5962
 */
const WIFI_URL =
    "https://itaiwan.gov.tw/ITaiwanDW/GetFile?fileName=IpSelect_tw.json&type=6";

/**
 * iTaiwan 公共充電站 API endpoint (Dataset 28592)
 *
 * @see https://data.gov.tw/dataset/28592
 */
const CHARGING_URL =
    "https://quality.data.gov.tw/dq_download_json.php?nid=28592&md5_url=d474a70fdd9953547d06abe56f60778e";

/**
 * 從 URL 獲取 JSON 資料
 * Fetch JSON data from URL.
 *
 * @param url - 目標 URL
 * @returns 解析後的 JSON 資料
 */
async function fetchJSON(url: string): Promise<any[]> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * 寫入 JSON 檔案
 * Write JSON file.
 *
 * @param filePath - 檔案路徑
 * @param data - 要寫入的資料
 */
async function writeJSON(filePath: string, data: any): Promise<void> {
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 主執行函式
 * Main execution function.
 */
async function main() {
    console.log("Fetching Wi‑Fi data…");
    const wifiRaw = await fetchJSON(WIFI_URL);

    console.log("Fetching charging‑station data…");
    const chargingRaw = await fetchJSON(CHARGING_URL);

    // 確保輸出目錄存在
    const outDir = resolve(DEFAULT_OUTPUT_DIR);
    await mkdir(outDir, { recursive: true });

    // 寫入原始檔案
    const wifiRawPath = resolve(outDir, "wifi-hotspots-raw.json");
    const chargingRawPath = resolve(outDir, "charging-stations-raw.json");

    await writeJSON(wifiRawPath, wifiRaw);
    await writeJSON(chargingRawPath, chargingRaw);

    console.log(`Raw files written to ${outDir}`);

    // 轉換並寫入過濾後的檔案
    const wifiFiltered = convertWiFiArray(wifiRaw);
    const chargingFiltered = convertChargingArray(chargingRaw);

    const wifiPath = resolve(outDir, "wifi-hotspots.json");
    const chargingPath = resolve(outDir, "charging-stations.json");

    await writeJSON(wifiPath, wifiFiltered);
    await writeJSON(chargingPath, chargingFiltered);

    console.log(`Filtered files written to ${outDir}`);
    console.log(`Wi‑Fi: ${wifiFiltered.length} items, Charging: ${chargingFiltered.length} items`);

    // Git 操作（仅在 CI 環境或手動啟用時執行）
    if (process.env.CI === "true" || process.argv.includes("--push")) {
        try {
            execSync("git add public/data/*.json", { stdio: "inherit" });
            execSync("git commit -m 'chore: sync Wi‑Fi & charging station data (auto)'", {
                stdio: "inherit",
            });
            execSync("git push", { stdio: "inherit" });
            console.log("Git commit & push successful.");
        } catch (error) {
            console.warn("Git commit failed – maybe there are no changes.");
        }
    } else {
        console.log("Skipping Git operations. Use --push flag or set CI=true to enable.");
    }
}

// 執行
main().catch((error) => {
    console.error("Sync script failed:", error);
    process.exit(1);
});