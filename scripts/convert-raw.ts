/**
 * 將已下載的原始 JSON 檔案轉換為結構化資料
 * Convert downloaded raw JSON files to structured data.
 *
 * 此腳本會讀取已經下載的 raw 檔案並進行轉換，
 * 不需要再次從網路下載。
 */
import fs from "fs-extra";
import { relative, resolve } from "path";
import {
	convertWiFiArray,
	convertChargingArray,
	convertWiFiRaw_TaipeiFree_To_iTaiwan,
} from "../src/lib/transform";
import {
	chargingNormalizePath,
	chargingRawPath,
	wifiRawPath_TaipeiFree,
	wifiNormalizePath,
	wifiRawPath_iTaiwan,
	categorySetPath,
} from './utils/const-paths';
import { __ROOT } from '../test/__root';
import { _sortCompByBucketAndBlock } from '@/lib/utils/grid/grid-utils-global';
import { execSync } from 'child_process';
import { __DATA_ROOT } from '@/lib/__root';

/**
 * 主執行函式
 * Main execution function.
 */
async function main()
{
	const wifiRaw = await fs.readJSON(wifiRawPath_iTaiwan);
	const taipeiWifiRaw = await fs.readJSON(wifiRawPath_TaipeiFree);
	const chargingRaw = await fs.readJSON(chargingRawPath);

	// 將台北市資料轉換為與 iTaiwan 相同的欄位格式
	// 台北市 JSON 使用大寫欄位：NAME, LATITUDE, LONGITUDE, ADDR
	const taipeiFormatted = taipeiWifiRaw.map(convertWiFiRaw_TaipeiFree_To_iTaiwan);

	// 合併 iTaiwan 與台北市 Wi-Fi 資料（僅用於轉換）
	const allWifiRaw = [...wifiRaw, ...taipeiFormatted];

	const categorySet = new Set<string>();

	const cb = (item: { value: any; isValid: boolean }) =>
	{
		item?.value?.category && categorySet.add(item.value.category);
	};

	// 轉換並寫入過濾後的檔案（合併後）
	const wifiFiltered = convertWiFiArray(allWifiRaw, { cb }).sort(_sortCompByBucketAndBlock);
	const chargingFiltered = convertChargingArray(chargingRaw, { cb }).sort(_sortCompByBucketAndBlock);

	await fs.outputJSON(wifiNormalizePath, wifiFiltered, { spaces: 2 });
	await fs.outputJSON(chargingNormalizePath, chargingFiltered, { spaces: 2 });

	await fs.outputJSON(categorySetPath, {
		categories: Array.from(categorySet).sort(),
	}, { spaces: 2 });

	console.log(`Filtered files written to ${__DATA_ROOT}`);
	console.log(
		`iTaiwan Wi‑Fi: ${wifiRaw.length}, Taipei Free: ${taipeiWifiRaw.length}, total: ${allWifiRaw.length}`,
	);
	console.log(`${relative(__ROOT, wifiNormalizePath)}`);
	console.log(
		`Charging: ${chargingRaw.length}`,
	);
	console.log(`${relative(__ROOT, chargingNormalizePath)}`);
}

// 執行
main().catch((error) =>
{
	console.error("Sync script failed:", error);
	process.exit(1);
});
