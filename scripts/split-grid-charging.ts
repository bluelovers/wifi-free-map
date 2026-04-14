/**
 * 將充電站資料依地圖區塊切割
 * Split charging station data into map grid blocks.
 *
 * 將充電站資料切割為獨立的區塊檔案。
 *
 * 注意：此腳本僅切割資料，不建立 grid-index.json。
 * 執行完所有資料切割腳本後，請執行 build-grid-index.ts 建立統一的索引表。
 */

import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { createBlockAggregator } from "./utils/grid-index-builder.js";
import { extractLocationInfo } from '@/lib/utils/grid/grid-address';
import { getBlockBounds, getBlockCenter, getBlockIndex } from '@/lib/utils/grid/grid-computation';

/**
 * 主執行函式
 */
async function main()
{
	// 讀取充電站資料
	const chargingData = await import("../public/data/charging-stations.json").then((m) => m.default);

	console.log(`載入 ${chargingData.length} 筆充電站資料`);

	// 建立輸出目錄
	const outDir = resolve(__dirname, "../public/data/grid-charging");
	await mkdir(outDir, { recursive: true });

	// 建立區塊聚合器
	const aggregator = createBlockAggregator({
		getBlockIndex,
		getBlockCenter,
		getBlockBounds,
		extractLocationInfo,
	});

	// 將每筆資料加入對應的區塊
	for (const station of chargingData)
	{
		aggregator.add(
			{ lat: station.lat, lng: station.lng, address: station.address },
			{ type: "charging", prefix: "grid-charging/" },
		);
	}

	// 寫入每個區塊的資料
	const blocks = aggregator.build();
	let fileCount = 0;
	for (const block of blocks)
	{
		// 建立區塊資料檔案
		const blockStations = chargingData.filter((s) =>
		{
			const idx = getBlockIndex(s.lat, s.lng);
			const blockRow = Math.floor((block.center.lat - 21.903126) / 0.0306959);
			const blockCol = Math.floor((block.center.lng - 118.2257211) / 0.0306959);
			return idx.row === blockRow && idx.col === blockCol;
		});

		const filePath = resolve(outDir, block.fileName);
		await writeFile(filePath, JSON.stringify(blockStations, null, 2), "utf-8");
		fileCount++;
	}

	console.log(`已寫入 ${fileCount} 個充電站區塊檔案至 ${outDir}`);
	console.log("");
	console.log("提示：請執行 build-grid-index.ts 建立統一的索引表。");

	// 統計資訊
	const counts = blocks.map((b) => b.dataset.charging?.count ?? 0).filter((c) => c > 0).sort((a, b) => a - b);

	if (counts.length > 0)
	{
		const minCount = counts[0];
		const maxCount = counts[counts.length - 1];
		const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

		console.log("");
		console.log("=== 充電站區塊統計 ===");
		console.log(`最小資料數: ${minCount}`);
		console.log(`最大資料數: ${maxCount}`);
		console.log(`平均資料數: ${avgCount.toFixed(1)}`);
	}
}

// 執行
main().catch((error) =>
{
	console.error("Charging grid split failed:", error);
	process.exit(1);
});
