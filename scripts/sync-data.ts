/**
 * 同步 iTaiwan Wi‑Fi、臺北市 Wi‑Fi 與公共充電站資料至 /public/data/
 * Sync iTaiwan Wi‑Fi, Taipei Free Wi‑Fi, and public charging‑station data to /public/data/.
 *
 * 此腳本會執行以下步驟：
 * 1. 下載 Wi‑Fi 資料 (Dataset 5962 iTaiwan + Dataset 121222 臺北市) 與充電站資料 (Dataset 28592)。
 * 2. 產生以下 JSON 檔案：
 *    - wifi-hotspots-raw.json（合併後的原始資料）
 *    - taipei-wifi-raw.json（臺北市原始資料備份）
 *    - wifi-hotspots.json（過濾後、型別化的資料）
 *    - charging-stations-raw.json（完整原始資料）
 *    - charging-stations.json（過濾後、型別化的資料）
 * 3. 將檔案寫入 public/data/ 目錄。
 * 4. 使用 git add / commit / push 把變更提交至遠端，供 CI 部署。
 *
 * 此腳本設計為可本地執行（pnpm ts-node scripts/sync-data.ts）或在 CI 中呼叫。
 */

import fs from "fs-extra";
import { resolve, relative } from "path";
import { execSync } from "child_process";
import { _sortCompByBucketAndBlock } from '@/lib/utils/grid/grid-utils-global';
import { __ROOT } from '../test/__root';
import {
	chargingNormalizePath,
	chargingRawPath,
	wifiRawPath_TaipeiFree,
	wifiNormalizePath,
	wifiRawPath_iTaiwan,
} from './utils/const-paths';
import { __DATA_ROOT } from '@/lib/__root';

/**
 * iTaiwan Wi‑Fi API endpoint (Dataset 5962)
 *
 * @see https://data.gov.tw/dataset/5962
 */
const WIFI_URL =
	"https://itaiwan.gov.tw/ITaiwanDW/GetFile?fileName=IpSelect_tw.json&type=6";

/**
 * 臺北市公眾區免費無線上網熱點資料 (Dataset 121222)
 * JSON 格式下載網址
 *
 * @see https://data.gov.tw/dataset/121222
 */
const TAIPEI_WIFI_URL =
	"https://quality.data.gov.tw/dq_download_json.php?nid=121222&md5_url=aaf8100508dbd5e5ed0a706233c804dd";

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
async function fetchJSON(url: string): Promise<any[]>
{
	const response = await fetch(url);
	if (!response.ok)
	{
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
async function writeJSON(filePath: string, data: any): Promise<void>
{
	return fs.outputJSON(filePath, data, { spaces: 2 });
}

/**
 * 主執行函式
 * Main execution function.
 */
async function main()
{
	console.log("Fetching iTaiwan Wi‑Fi data…");
	const wifiRaw = await fetchJSON(WIFI_URL);

	console.log("Fetching Taipei Free Wi‑Fi data…");
	const taipeiWifiRaw = await fetchJSON(TAIPEI_WIFI_URL);

	console.log("Fetching charging‑station data…");
	const chargingRaw = await fetchJSON(CHARGING_URL);

	await writeJSON(wifiRawPath_iTaiwan, wifiRaw);
	await writeJSON(wifiRawPath_TaipeiFree, taipeiWifiRaw);
	await writeJSON(chargingRawPath, chargingRaw);

	console.log(`Raw files written to ${__DATA_ROOT}`);
}

// 執行
main().catch((error) =>
{
	console.error("Sync script failed:", error);
	process.exit(1);
});
