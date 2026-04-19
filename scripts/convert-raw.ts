/**
 * 將已下載的原始 JSON 檔案轉換為結構化資料
 * Convert downloaded raw JSON files to structured data.
 *
 * 此腳本會讀取已經下載的 raw 檔案並進行轉換，
 * 不需要再次從網路下載。
 *
 * 使用方式：
 * - 轉換所有檔案：pnpm ts-node scripts/convert-raw.ts
 * - 只轉換 Wi-Fi：pnpm ts-node scripts/convert-raw.ts --wifi
 * - 只轉換充電站：pnpm ts-node scripts/convert-raw.ts --charging
 *
 * Run:
 * - Convert all: pnpm ts-node scripts/convert-raw.ts
 * - Wi‑Fi only: pnpm ts-node scripts/convert-raw.ts --wifi
 * - Charging only: pnpm ts-node scripts/convert-raw.ts --charging
 */

import fs from "fs-extra";
import { relative, resolve } from "path";
import {
	convertWiFiArray,
	convertChargingArray,
	DEFAULT_OUTPUT_DIR,
} from "../src/lib/transform";
import { chargingPath, chargingRawPath, taipeiWifiRawPath, wifiPath, wifiRawPath } from './utils/const-paths';
import { __ROOT } from '../test/__root';
import { _sortCompByBucketAndBlock } from '@/lib/utils/grid/grid-utils-global';
import { execSync } from 'child_process';

/**
 * 主執行函式
 * Main execution function.
 */
async function main()
{
	const wifiRaw = await fs.readJSON(wifiRawPath);
	const taipeiWifiRaw = await fs.readJSON(taipeiWifiRawPath);
	const chargingRaw = await fs.readJSON(chargingRawPath);

	// 將台北市資料轉換為與 iTaiwan 相同的欄位格式
	// 台北市 JSON 使用大寫欄位：NAME, LATITUDE, LONGITUDE, ADDR
	const taipeiFormatted = taipeiWifiRaw.map((row: any) => ({
		Name: row.NAME || "",
		Latitude: row.LATITUDE || "",
		Longitude: row.LONGITUDE || "",
		Address: row.ADDR || "",
	}));

	// 合併 iTaiwan 與台北市 Wi-Fi 資料（僅用於轉換）
	const allWifiRaw = [...wifiRaw, ...taipeiFormatted];

	// 轉換並寫入過濾後的檔案（合併後）
	const wifiFiltered = convertWiFiArray(allWifiRaw).sort(_sortCompByBucketAndBlock);
	const chargingFiltered = convertChargingArray(chargingRaw).sort(_sortCompByBucketAndBlock);

	await fs.outputJSON(wifiPath, wifiFiltered, { spaces: 2 });
	await fs.outputJSON(chargingPath, chargingFiltered, { spaces: 2 });

	console.log(`Filtered files written to ${DEFAULT_OUTPUT_DIR}`);
	console.log(
		`iTaiwan Wi‑Fi: ${wifiRaw.length}, Taipei Free: ${taipeiWifiRaw.length}, total: ${allWifiRaw.length}`,
	);
	console.log(`${relative(__ROOT, wifiPath)}`);
	console.log(
		`Charging: ${chargingRaw.length}`,
	);
	console.log(`${relative(__ROOT, chargingPath)}`);

	// Git 操作（仅在 CI 環境或手動啟用時執行）
	if (process.env.CI === "true" || process.argv.includes("--push"))
	{
		try
		{
			execSync("git add public/data/*.json", { stdio: "inherit" });
			execSync("git commit -m 'chore: sync Wi‑Fi & charging station data (auto)'", {
				stdio: "inherit",
			});
			execSync("git push", { stdio: "inherit" });
			console.log("Git commit & push successful.");
		}
		catch (error)
		{
			console.warn("Git commit failed – maybe there are no changes.");
		}
	}
	else
	{
		console.log("Skipping Git operations. Use --push flag or set CI=true to enable.");
	}
}

// 執行
main().catch((error) =>
{
	console.error("Sync script failed:", error);
	process.exit(1);
});
