/**
 * 將 Wi-Fi 熱點資料依地圖區塊切割
 * Split Wi-Fi hotspot data into map grid blocks.
 *
 * 使用萬華區的區塊大小 (0.0306959 度) 作為分割標準，將全台灣劃分為多個區塊。
 * 每個區塊產生一個獨立的 JSON 檔案。
 *
 * 注意：此腳本僅切割資料，不建立 grid-index.json。
 * 執行完所有資料切割腳本後，請執行 build-grid-index.ts 建立統一的索引表。
 */

import { writeFile, mkdir, unlink } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { createBlockAggregator } from "./utils/grid-index-builder";
import { getBlockBounds, getBlockCenter, getBlockIndex } from '@/lib/utils/grid/grid-computation';
import { extractLocationInfo } from '@/lib/utils/grid/grid-address';

/**
 * 主執行函式
 * Main execution function.
 */
async function main()
{
	// 讀取 Wi-Fi 熱點資料
	const wifiData = await import("../public/data/wifi-hotspots.json").then((m) => m.default);

	console.log(`載入 ${wifiData.length} 筆 Wi-Fi 熱點資料`);

	// 建立輸出目錄
	const outDir = resolve(__dirname, "../public/data/grid-wifi");
	await mkdir(outDir, { recursive: true });

	// 建立區塊聚合器
	const aggregator = createBlockAggregator({
		getBlockIndex,
		getBlockCenter,
		getBlockBounds,
		extractLocationInfo,
	});

	// 將每筆資料加入對應的區塊
	for (const hotspot of wifiData)
	{
		aggregator.add(
			{ lat: hotspot.lat, lng: hotspot.lng, address: hotspot.address },
			{ type: "wifi", prefix: "grid-wifi/" },
		);
	}

	// 寫入每個區塊的資料
	const blocks = aggregator.build();
	let fileCount = 0;
	for (const block of blocks)
	{
		// 建立區塊資料檔案
		const blockHotspots = wifiData.filter((h) =>
		{
			const idx = getBlockIndex(h.lat, h.lng);
			const blockRow = Math.floor((block.center.lat - 21.903126) / 0.0306959);
			const blockCol = Math.floor((block.center.lng - 118.2257211) / 0.0306959);
			return idx.yIdx === blockRow && idx.xIdx === blockCol;
		});

		if (blockHotspots.length === 0)
		{
			console.log(`跳過空區塊: ${block.fileName}`);
			await unlink(resolve(outDir, block.fileName)).catch((err) => null);
			continue;
		}

		const filePath = resolve(outDir, block.fileName);
		await writeFile(filePath, JSON.stringify(blockHotspots, null, 2), "utf-8");
		fileCount++;
	}

	console.log(`總計　 ${wifiData.length} 筆資料`);
	console.log(`已寫入 ${fileCount} 個區塊檔案至 ${outDir}`);
	console.log("");
	console.log("提示：請執行 build-grid-index.ts 建立統一的索引表。");

	// 統計資訊
	const counts = blocks.map((b) => b.dataset.wifi?.count ?? 0).filter((c) => c > 0).sort((a, b) => a - b);
	const minCount = counts[0] ?? 0;
	const maxCount = counts[counts.length - 1] ?? 0;
	const avgCount = counts.reduce((a, b) => a + b, 0) / (counts.length || 1);

	console.log("");
	console.log("=== Wi-Fi 區塊統計 ===");
	console.log(`最小資料數: ${minCount}`);
	console.log(`最大資料數: ${maxCount}`);
	console.log(`平均資料數: ${avgCount.toFixed(1)}`);
}

// 執行
main().catch((error) =>
{
	console.error("Grid split failed:", error);
	process.exit(1);
});
