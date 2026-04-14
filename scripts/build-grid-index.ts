/**
 * 建立統一的 grid-index.json
 * Build unified grid-index.json from all data types.
 *
 * 此腳本讀取所有資料類型的資料檔案，建立統一的區塊索引表。
 * 應在其他資料切割腳本之後執行。
 */

import { writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { readdirSync, readFileSync } from "fs";
import { IBlockData, IDataEntry } from '@/lib/utils/grid/grid-types';
import { BLOCK_SIZE, DATA_TYPES, TAIWAN_BOUNDS } from '@/lib/utils/grid/grid-const';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 解析區塊檔名取得座標
 */
function parseBlockFileName(fileName: string): { lng: number; lat: number } | null
{
	const match = fileName.match(/^(-?\d+\.\d+)_(-?\d+\.\d+)\.json$/);
	if (!match) return null;
	return {
		lng: parseFloat(match[1]),
		lat: parseFloat(match[2]),
	};
}

/**
 * 清理路名中的縣市區前輟
 */
function cleanRoad(road: string): string
{
	return road.replace(/^[^\d\s]+(?:市|縣)/, "").replace(/^[^\d\s]+(?:區|市|鎮|鄉)/, "");
}

/**
 * 從地址提取位置資訊
 */
function extractLocationInfo(address: string): { zipCode: string; city: string; district: string; road: string }
{
	if (!address) return { zipCode: "", city: "", district: "", road: "" };

	const cleanAddress = address.replace(/\n/g, " ").trim();

	const zipMatch = cleanAddress.match(/^(\d{3,5})/);
	const zipCode = zipMatch ? zipMatch[1] : "";

	const cityMatch = cleanAddress.match(/([^\d\s]+(?:市|縣))/);
	const city = cityMatch ? cityMatch[1] : "";

	let remaining = cleanAddress;
	if (city) remaining = cleanAddress.replace(city, "");
	const districtMatch = remaining.match(/([^\d\s]+(?:區|市|鎮|鄉))/);
	const district = districtMatch ? districtMatch[1] : "";

	const roadMatch = cleanAddress.match(/[^\d\s]+(?:路|街|大道)[一二三四五六七八九十]*(?:段)?/);
	const road = roadMatch ? roadMatch[0] : "";

	return { zipCode, city, district, road };
}

/**
 * 主執行函式
 */
async function main()
{
	console.log("=== 建立統一 grid-index.json ===\n");

	const blocks = new Map<string, IBlockData>();

	// 遍歷每個資料類型
	for (const dataType of DATA_TYPES)
	{
		const dataDir = resolve(__dirname, `../public/data/${dataType.dir}`);

		try
		{
			const files = readdirSync(dataDir).filter((f) => f.endsWith(".json"));
			console.log(`掃描 ${dataType.dir}/: ${files.length} 個檔案`);

			for (const fileName of files)
			{
				const coords = parseBlockFileName(fileName);
				if (!coords) continue;

				const filePath = resolve(dataDir, fileName);
				const content = readFileSync(filePath, "utf-8");
				const data: IDataEntry[] = JSON.parse(content);

				const { lng, lat } = coords;

				// 計算區塊索引
				const row = Math.floor((lat - TAIWAN_BOUNDS.minLat) / BLOCK_SIZE);
				const col = Math.floor((lng - TAIWAN_BOUNDS.minLng) / BLOCK_SIZE);
				const blockKey = `${row}-${col}`;

				// 建立或取得區塊資料
				if (!blocks.has(blockKey))
				{
					const center = {
						lat: TAIWAN_BOUNDS.minLat + (row + 0.5) * BLOCK_SIZE,
						lng: TAIWAN_BOUNDS.minLng + (col + 0.5) * BLOCK_SIZE,
					};
					const north = TAIWAN_BOUNDS.minLat + (row + 1) * BLOCK_SIZE;
					const south = TAIWAN_BOUNDS.minLat + row * BLOCK_SIZE;
					const east = TAIWAN_BOUNDS.minLng + (col + 1) * BLOCK_SIZE;
					const west = TAIWAN_BOUNDS.minLng + col * BLOCK_SIZE;

					blocks.set(blockKey, {
						center: {
							lat: parseFloat(center.lat.toFixed(6)),
							lng: parseFloat(center.lng.toFixed(6)),
						},
						bounds: {
							northWest: { lat: parseFloat(north.toFixed(6)), lng: parseFloat(west.toFixed(6)) },
							northEast: { lat: parseFloat(north.toFixed(6)), lng: parseFloat(east.toFixed(6)) },
							southWest: { lat: parseFloat(south.toFixed(6)), lng: parseFloat(west.toFixed(6)) },
							southEast: { lat: parseFloat(south.toFixed(6)), lng: parseFloat(east.toFixed(6)) },
						},
						locations: new Set<string>(),
						dataset: {},
					});
				}

				const block = blocks.get(blockKey)!;

				// 新增或更新 dataset 項目
				const existingCount = block.dataset[dataType.type]?.count ?? 0;
				block.dataset[dataType.type] = {
					fileName: `${dataType.prefix}${fileName}`,
					count: existingCount + data.length,
				};

				// 處理位置資訊
				for (const entry of data)
				{
					if (entry.address)
					{
						const { zipCode, city, district, road } = extractLocationInfo(entry.address);

						const baseLocation = [zipCode, city, district].filter(Boolean).join("");
						if (baseLocation) block.locations.add(baseLocation);

						if (road)
						{
							const locationWithRoad = [baseLocation, cleanRoad(road)].filter(Boolean).join("");
							block.locations.add(locationWithRoad);
						}
					}
				}
			}
		}
		catch (error)
		{
			console.warn(`警告: 無法讀取 ${dataType.dir}/ 目錄:`, (error as Error).message);
		}
	}

	console.log(`\n建立 ${blocks.size} 個區塊`);

	// 建立索引表
	const indexTable = Array.from(blocks.entries()).map(([blockKey, blockData]) =>
	{
		const fileName = `${blockData.center.lng.toFixed(4)}_${blockData.center.lat.toFixed(4)}.json`;

		return {
			fileName,
			center: blockData.center,
			bounds: blockData.bounds,
			dataset: blockData.dataset,
			locations: Array.from(blockData.locations).slice(0, 20),
		};
	});

	// 依照區塊中心點排序
	indexTable.sort((a, b) =>
	{
		if (a.center.lat !== b.center.lat) return b.center.lat - a.center.lat;
		return a.center.lng - b.center.lng;
	});

	// 寫入索引表
	const indexPath = resolve(__dirname, "../public/data/grid-index.json");
	await writeFile(indexPath, JSON.stringify(indexTable, null, 2), "utf-8");

	console.log(`索引表已寫入 ${indexPath}`);

	// 統計資訊
	const wifiBlocks = indexTable.filter((b) => b.dataset.wifi);
	const chargingBlocks = indexTable.filter((b) => b.dataset.charging);
	const mixedBlocks = indexTable.filter((b) => b.dataset.wifi && b.dataset.charging);

	console.log("\n=== 統計 ===");
	console.log(`總區塊數: ${indexTable.length}`);
	console.log(`Wi-Fi 區塊: ${wifiBlocks.length}`);
	console.log(`充電站區塊: ${chargingBlocks.length}`);
	console.log(`混合區塊: ${mixedBlocks.length}`);
}

// 執行
main().catch((error) =>
{
	console.error("建立索引表失敗:", error);
	process.exit(1);
});
