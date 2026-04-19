/**
 * 建立統一的 grid-index.json
 * Build unified grid-index.json from all data types.
 *
 * 使用 grid-utils-global 提供的工具函數。
 * 讀取所有資料類型的區塊檔案，建立統一的索引表。
 * 應在其他資料切割腳本之後執行。
 */

import { writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { readdirSync, readFileSync } from "fs";

import { IBlockData, IDataEntry, IGridBlock, EnumDatasetType } from "../src/lib/utils/grid/grid-types";
import { DATA_TYPES } from "../src/lib/utils/grid/grid-const";
import { parseBlockFileName, cleanRoad, extractLocationInfo } from "../src/lib/utils/grid/grid-address";

// 使用 grid-utils-global 的工具函數
import {
	calcGlobalBlockIndexAndCoord,
	_calcCoordToBlockIndex,
	calculateCroodToBounds,
	_calculateCenterByAnyPointCore,
	fixCoord,
	_idxToRange,
	rangeToBounds,
	_formatBlockKey,
	_croodToRange,
} from "../src/lib/utils/grid/grid-utils-global";
import { __ROOT } from '../test/__root';

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
		const dataDir = resolve(__ROOT, `public/data/${dataType.dir}`);

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

				/** 使用 grid-utils-global 計算區塊索引 / Calculate block index using grid-utils-global */
				const blockIndex = calcGlobalBlockIndexAndCoord({ lng, lat });

				/** 區塊 key / Block key */
				const blockKey = _formatBlockKey(blockIndex.minLng, blockIndex.minLat);

				// 建立或取得區塊資料
				if (!blocks.has(blockKey))
				{
					/**
					 * 使用 grid-utils-global 計算區塊邊界與中心點
					 * Calculate block bounds and center using grid-utils-global
					 */
					const range = _croodToRange(blockIndex);
					const bounds = rangeToBounds(range);

					const center = fixCoord(_calculateCenterByAnyPointCore(blockIndex));

					blocks.set(blockKey, {
						center,
						bounds,
						locations: new Set<string>(),
						dataset: {} as any,
					});
				}

				const block = blocks.get(blockKey)!;

				// 新增或更新 dataset 項目
				const existingCount = block.dataset[dataType.type as EnumDatasetType]?.count ?? 0;
				block.dataset[dataType.type as EnumDatasetType] = {
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

	blocks.forEach

	// 建立索引表
	const indexTable = Array.from(blocks.entries()).reduce((acc, [blockKey, blockData]) =>
	{
		/** 區塊檔名 / Block file name */
		const fileName = `${blockData.center.lng.toFixed(4)}_${blockData.center.lat.toFixed(4)}.json`;

		let totalCount = 0;

		// 如果沒有位置資訊，跳過這個區塊
		Object.entries(blockData.dataset).forEach(([key, value]) =>
		{
			if (value.count === 0)
			{
				delete blockData.dataset[key as EnumDatasetType];
			}
			else
			{
				totalCount += value.count;
			}
		});

		if (totalCount === 0)
		{
			console.log(`警告: 區塊 ${blockKey} 沒有位置資訊`);
			return acc;
		}

		acc.push({
			fileName,
			center: blockData.center,
			bounds: blockData.bounds,
			dataset: blockData.dataset,
			locations: Array.from(blockData.locations).slice(0, 20),
		});

		return acc;
	}, [] as Array<IGridBlock>);

	// 依照區塊中心點排序
	indexTable.sort((a, b) =>
	{
		if (a.center.lat !== b.center.lat) return b.center.lat - a.center.lat;
		return a.center.lng - b.center.lng;
	});

	// 寫入索引表
	const indexPath = resolve(__ROOT, "public/data/grid-index.json");
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