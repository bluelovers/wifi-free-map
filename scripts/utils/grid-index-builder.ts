import {
	EnumDatasetType,
	IBlockData,
	IBounds,
	IDatasetEntry,
	IGpsCoordinate,
	IGridBlock,

} from '@/lib/utils/grid/grid-types';
import { IBlockAggregator, IGridUtils } from '@/lib/utils/grid/grid-types-opts';
import { cleanRoad } from '@/lib/utils/grid/grid-address';
import { tsObjectEntries } from 'ts-type-object-entries';

/**
 * 建立區塊聚合器工廠函式
 * Create block aggregator factory function
 *
 * @param gridUtils - grid-utils 模組
 * @returns 區塊聚合器實例
 */
export function createBlockAggregator(gridUtils: IGridUtils): IBlockAggregator
{
	/** 內部區塊資料 Map */
	const blocks = new Map<string, IBlockData>();

	/**
	 * 新增資料至區塊
	 */
	function add(
		item: { lat: number; lng: number; address?: string },
		options: { type: EnumDatasetType; prefix: string },
	): void
	{
		const { yIdx, xIdx } = gridUtils.getBlockIndex(item.lat, item.lng);
		const blockKey = `${yIdx}-${xIdx}`;

		// 建立或取得區塊資料
		if (!blocks.has(blockKey))
		{
			const center = gridUtils.getBlockCenter(yIdx, xIdx);
			const bounds = gridUtils.getBlockBounds(yIdx, xIdx);
			blocks.set(blockKey, {
				center,
				bounds,
				locations: new Set<string>(),
				dataset: {} as any,
			});
		}

		const block = blocks.get(blockKey)!;

		// 新增或更新 dataset 項目
		const datasetEntry: IDatasetEntry = {
			fileName: `${options.prefix}${block.center.lng.toFixed(4)}_${block.center.lat.toFixed(4)}.json`,
			count: (block.dataset[options.type]?.count ?? 0) + 1,
		};
		block.dataset[options.type] = datasetEntry;

		// 處理位置資訊
		if (item.address)
		{
			const { zipCode, city, district, road } = gridUtils.extractLocationInfo(item.address);

			// 基本位置：郵遞區號 + 縣市 + 區
			const baseLocation = [zipCode, city, district].filter(Boolean).join("");
			if (baseLocation) block.locations.add(baseLocation);

			// 含路名位置
			if (road)
			{
				const locationWithRoad = [baseLocation, cleanRoad(road)].filter(Boolean).join("");
				block.locations.add(locationWithRoad);
			}
		}
	}

	/**
	 * 建立統一格式的索引表
	 */
	function build(): IGridBlock[]
	{
		const indexTable: IGridBlock[] = Array.from(blocks.entries()).map(
			([blockKey, blockData]) =>
			{
				const fileName = `${blockData.center.lng.toFixed(4)}_${blockData.center.lat.toFixed(4)}.json`;

				return {
					fileName,
					center: {
						lat: parseFloat(blockData.center.lat.toFixed(6)),
						lng: parseFloat(blockData.center.lng.toFixed(6)),
					},
					bounds: {
						northWest: {
							lat: parseFloat(blockData.bounds.northWest.lat.toFixed(6)),
							lng: parseFloat(blockData.bounds.northWest.lng.toFixed(6)),
						},
						northEast: {
							lat: parseFloat(blockData.bounds.northEast.lat.toFixed(6)),
							lng: parseFloat(blockData.bounds.northEast.lng.toFixed(6)),
						},
						southWest: {
							lat: parseFloat(blockData.bounds.southWest.lat.toFixed(6)),
							lng: parseFloat(blockData.bounds.southWest.lng.toFixed(6)),
						},
						southEast: {
							lat: parseFloat(blockData.bounds.southEast.lat.toFixed(6)),
							lng: parseFloat(blockData.bounds.southEast.lng.toFixed(6)),
						},
					},
					dataset: blockData.dataset,
					locations: Array.from(blockData.locations).slice(0, 20),
				};
			},
		);

		// 依照區塊中心點排序（緯度遞減、經度遞增）
		indexTable.sort((a, b) =>
		{
			if (a.center.lat !== b.center.lat) return b.center.lat - a.center.lat;
			return a.center.lng - b.center.lng;
		});

		return indexTable;
	}

	return { add, build };
}

/**
 * 合併多個聚合器
 * Merge multiple aggregators
 *
 * @param aggregators - 要合併的聚合器陣列
 * @param gridUtils - grid-utils 模組
 * @returns 合併後的聚合器
 */
export function mergeAggregators(
	aggregators: IBlockAggregator[],
	gridUtils: IGridUtils,
): IBlockAggregator
{
	// 建立新的聚合器
	const merged = createBlockAggregator(gridUtils);

	// 收集所有資料
	const allData: Array<{
		item: { lat: number; lng: number; address?: string };
		options: { type: EnumDatasetType; prefix: string }
	}> = [];

	// 遍歷所有聚合器的 build 結果，提取資料
	for (const agg of aggregators)
	{
		const blocks = agg.build();
		for (const block of blocks)
		{
			// 從 dataset 中提取各類型的 count 和位置資訊
			for (const [type, entry] of tsObjectEntries(block.dataset))
			{
				// 計算大約的座標（從檔名）
				const parts = entry.fileName.replace(/^[^/]+\//, "").replace(".json", "").split("_");
				if (parts.length === 2)
				{
					const lng = parseFloat(parts[0]);
					const lat = parseFloat(parts[1]);

					// 新增多筆資料（根據 count）
					for (let i = 0; i < entry.count; i++)
					{
						allData.push({
							item: {
								lat,
								lng,
								address: block.locations[0] ?? "",
							},
							options: { type, prefix: entry.fileName.replace(/[^/]+\//, "") },
						});
					}
				}
			}
		}
	}

	// 重新新增至合併後的聚合器
	for (const { item, options } of allData)
	{
		merged.add(item, options);
	}

	return merged;
}

/**
 * 從舊格式索引表讀取並轉換為聚合器
 * Load from old format index table and convert to aggregator
 *
 * @param oldIndex - 舊格式的索引表
 * @param gridUtils - grid-utils 模組
 * @returns 區塊聚合器
 */
export function loadFromOldIndex(
	oldIndex: Array<{
		fileName: string;
		center: IGpsCoordinate;
		bounds: IBounds;
		count: number;
		locations: string[];
		type?: string;
	}>,
	gridUtils: IGridUtils,
): IBlockAggregator
{
	const aggregator = createBlockAggregator(gridUtils);

	for (const entry of oldIndex)
	{
		// 從檔名判斷前輟和類型
		const isCharging = entry.fileName.startsWith("charging-");
		const type = entry.type ?? (isCharging ? EnumDatasetType.CHARGING : EnumDatasetType.WIFI);
		const prefix = isCharging ? "grid-charging/" : "grid-wifi/";

		// 根據 count 新增多筆資料
		for (let i = 0; i < entry.count; i++)
		{
			aggregator.add(
				{
					lat: entry.center.lat,
					lng: entry.center.lng,
					address: entry.locations[0] ?? "",
				},
				{ type, prefix },
			);
		}
	}

	return aggregator;
}
