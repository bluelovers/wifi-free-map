/**
 * 將 Wi-Fi 熱點資料依地圖區塊切割
 * Split Wi-Fi hotspot data into map grid blocks.
 *
 * 使用 grid-utils-global 提供的工具函數進行分割。
 * 使用 L1 層級（15x15 區塊一組）作為資料夾結構。
 * 此腳本僅切割資料，不建立 grid-index.json。
 * 執行完所有資料切割腳本後，請執行 build-grid-index.ts 建立統一的索引表。
 */

import fs from "fs-extra";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// 使用 grid-split 的生成器與同步函數
import { splitDataByL1GridGenerator, splitDataByL1Grid } from "../src/lib/utils/grid/grid-split";
import { __ROOT } from '../test/__root';
import { _sortCompByBucketAndBlock } from '@/lib/utils/grid/grid-utils-global';
import { __DATA_ROOT } from '@/lib/__root';

/**
 * 主執行函式
 */
async function main()
{
	// 讀取 Wi-Fi 熱點資料
	const wifiData = await import("../public/data/raw-normalize/wifi-hotspots.json").then((m) => m.default);

	console.log(`載入 ${wifiData.length} 筆 Wi-Fi 熱點資料`);

	// 建立輸出目錄
	const outDir = resolve(__DATA_ROOT, "grid-wifi");

	await fs.emptyDir(outDir);

	/** 檔案計數器 / File counter */
	let fileCount = 0;
	let dataCount = 0;

	// 使用生成器模式分割資料
	// Using generator pattern to split data
	// @ts-ignore
	for (const result of splitDataByL1GridGenerator(wifiData))
	{
		if (!result)
		{
			continue;
		}

		const [bucketPath, blockPath, items] = result;

		// 跳過空區塊
		if (items.length === 0)
		{
			continue;
		}

		/** 區塊檔名 / Block file name */
		const fileName = `${blockPath}.json`;

		/** 輸出路徑 / Output path */
		const filePath = resolve(outDir, bucketPath, fileName);

		dataCount += items.length;

		if (await fs.exists(filePath))
		{
			/**
			 * 按照預期來說，以下這段代碼應該是不會執行的。
			 * 資料雖以經緯度排序過，但為了防止非預期狀況發生或錯誤修正排序算法，
			 * 這裡還是以防萬一讀取已經輸出的緩存並且重新排序一次。
			 * 當此段代碼執行時代表有某處的算法被改變了，需要檢查。
			 */
			const existingData = await fs.readJSON(filePath);
			items.push(...existingData);
			items.sort(_sortCompByBucketAndBlock);
		}

		// 寫入區塊資料
		await fs.outputJSON(filePath, items, { spaces: 2 });
		fileCount++;
	}

	console.log(`總計　 ${dataCount}/${wifiData.length} 筆資料`);
	console.log(`已寫入 ${fileCount} 個區塊檔案至 ${outDir}`);
	console.log("");
	console.log("提示：請執行 build-grid-index.ts 建立統一的索引表。");
}

// 執行
main().catch((error) =>
{
	console.error("Wi-Fi grid split failed:", error);
	process.exit(1);
});