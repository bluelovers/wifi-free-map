/**
 * 網格區塊聚合器 V2
 * Grid block aggregator V2
 *
 * 使用生成器模式進行資料分割與聚合
 * Uses generator pattern for data splitting and aggregation
 */
import { splitDataByL1GridGenerator } from '@/lib/utils/grid/grid-split';
import {
	EnumDatasetType,
	IDataset,
	IFormatBlockKey,
	IGpsCoordinate,
	IGridBlock,
	ISplitResult,
	IValueArrayOrIterable,
} from '@/lib/utils/grid/grid-types';
import { exists } from 'fs-extra';
import path from 'upath2';
import { opendir, writeFile, mkdir, readFile } from 'fs/promises';
import { _formatBlockKey } from './grid-utils-global';
import { cleanRoad, extractLocationInfo } from './grid-address';

/**
 * [區塊導向索引架構 / Block-Oriented Index Architecture]
 * -------------------------------------------------------------------------
 * 1. 結構設計：將資料集 (dataset) 下放到各個 blockId 鍵值中。
 * 2. 前端優勢：
 * - 零路徑拼湊：直接從 index.json 取得完整 fetch 路徑。
 * - 多類型同步：單一 BlockId 同時得知是否有 WiFi 與充電站。
 * 3. 適用場景：
 * - 當不同資料類型 (如 WiFi 和 Charging) 的分佈不對稱時，
 * 此結構能精確標記「哪一格只有 WiFi」、「哪一格兩者皆有」。
 * -------------------------------------------------------------------------
 * * [路徑格式] fileName 建議儲存從 data/ 根目錄開始的相對路徑。
 */
export interface IMetadataBucketIndex
{
	/**
	 * 該 Bucket 下實際存在的 Block ID (例如: "121.4800_25.0200")
	 */
	activeBlocks: IFormatBlockKey<'_'>[];

	/**
	 * 行政區集合
	 */
	locations: string[];

	/** 核心資料：以 blockId 為 Key */
	data: Record<IFormatBlockKey<'_'>, IMetadataUnifiedBlockIndex>;
}

export interface IMetadataUnifiedBlockIndex
{
	/** 該 Block 涵蓋的行政區 (選填，可做細緻過濾) */
	locations: string[];
	/** 該 Block 擁有的不同類型資料集 */
	dataset: Record<EnumDatasetType, { fileName: string }>;
}

/**
 * 建立區塊聚合器 V2
 * Create block aggregator V2
 *
 * 將資料依據 L1 網格進行分割與聚合
 * Splits and aggregates data according to L1 grid
 *
 * @param inputAndOptions - 輸入資料與選項
 * @param inputAndOptions.data - 資料陣列或 Iterable
 * @param inputAndOptions.normalize - 資料正規化函式（可選）
 * @returns 區塊聚合結果
 */
export function createBlockAggregatorV2<T extends IGpsCoordinate, R extends T>(inputAndOptions: {
	data: IValueArrayOrIterable<T>;
	/** 正規化函式 / Normalize function */
	normalize(item: T, items: T[]): R;
})
{
	/** 區塊索引記錄 / Block index record */
	const recordIndex: Record<IFormatBlockKey<'/'>, Record<IFormatBlockKey<'_'>, IGridBlock>> = {};
	/** 分割結果記錄 / Split result record */
	const recordSplit: ISplitResult<R> = {};

	// @ts-ignore
	for (const result of splitDataByL1GridGenerator(inputAndOptions.data))
	{
		if (!result) continue;

		const [bucketPath, blockPath, items] = result;

		recordSplit[bucketPath] ??= {};
		recordSplit[bucketPath][blockPath] ??= [];

		const normalizedItems: R[] = recordSplit[bucketPath][blockPath];

		if (inputAndOptions.normalize)
		{
			/** 對每個項目進行正規化 / Normalize each item */
			for (const item of items)
			{
				const normalizedItem = inputAndOptions.normalize(item, items);
				normalizedItem && normalizedItems.push(normalizedItem);
			}
		}
		else
		{
			/**
			 * 如果沒有正規化函式，直接使用原始資料
			 * If no normalize function, use raw data directly
			 */
			normalizedItems.push(...items as R[]);
		}
	}

	return {
		/** 區塊索引 / Block index */
		recordIndex,
		/** 分割結果 / Split result */
		recordSplit,
	};
}

/**
 * [三級導航索引體系 / Triple-Level Navigation Index]
 * -------------------------------------------------------------------------
 * L1: /manifest.json
 * - 職責：全局入口。標註哪些「經緯桶」是有資料的。
 * * L2: /index/{lng}/index.json
 * - 職責：經度導航。標註該經度帶下有哪些活躍的「經緯桶」。
 * - 效益：前端只需載入對應經度的索引，即可得知垂直方向的資料分佈。
 * * L3: /index/{lng}/{lat}/index.json
 * - 職責：區塊決策。提供最細緻的 blockId 與實體檔案路徑 (dataset)。
 * -------------------------------------------------------------------------
 * * [效能提示]
 * 這種結構允許前端實現「漸進式加載」：
 * 縣市層級顯示 (L1) -> 區域範圍高亮 (L2) -> 精確點位加載 (L3)。
 */
export async function buildHierarchicalIndex(dataRoot: string)
{
	const types = [EnumDatasetType.WIFI, EnumDatasetType.CHARGING];
	// 用於儲存彙整後的 Bucket 資訊
	// Key 格式: "121.3000/24.9000"
	const bucketMap = new Map<string, {
		locations: Set<string>,
		types: Set<EnumDatasetType>,
		blocks: Map<IFormatBlockKey<'_'>, IMetadataUnifiedBlockIndex>
	}>();

	let totalCount = 0;
	let totalCountWifi = 0;
	let totalCountCharging = 0;

	// --- 階段 1：掃描實體檔案並彙整 ---
	for (const type of types)
	{
		const typeFolderPath = `grid-${type.toLowerCase()}`;
		const typeFolder = path.join(dataRoot, typeFolderPath);

		// 檢查資料夾是否存在
		if (!(await exists(typeFolder))) continue;

		const lngDirs = await opendir(typeFolder);
		for await (const lngDir of lngDirs)
		{
			const latPath = path.join(typeFolder, lngDir.name);
			if (!lngDir.isDirectory()) continue;

			const latDirs = await opendir(latPath);
			for await (const latDir of latDirs)
			{
				const bucketKey = _formatBlockKey(lngDir.name, latDir.name, { sep: '/' });
				const blockPath = path.join(latPath, latDir.name);
				const files = await opendir(blockPath);

				if (!bucketMap.has(bucketKey))
				{
					bucketMap.set(bucketKey, {
						locations: new Set(),
						types: new Set(),
						blocks: new Map(),
					});
				}

				const bucketData = bucketMap.get(bucketKey)!;
				bucketData.types.add(type);

				for await (const file of files)
				{
					if (!file.isFile()) continue;

					let p = path.parse(file.name);

					if (p.ext === '.json' && p.name !== 'index')
					{
						const blockId = p.name as IFormatBlockKey<'_'>;

						const blockData: IMetadataUnifiedBlockIndex = bucketData.blocks.get(blockId) ?? {
							locations: [],
							dataset: {} as any,
						};

						blockData.dataset[type] = {
							fileName: path.join(typeFolderPath, lngDir.name, latDir.name, file.name),
						};

						// 這裡可以選擇性讀取檔案內容來填充 locations (行政區)
						// bucketData.locations.add(extractAdminArea(fileContent));

						const fileContent = await readFile(path.join(blockPath, file.name), 'utf-8').then(JSON.parse);
						// console.log(fileContent);

						/**
						 * 處理位置資訊
						 */
						for (const entry of fileContent)
						{
							totalCount++;
							if (type === EnumDatasetType.WIFI)
							{
								totalCountWifi++;
							}
							else if (type === EnumDatasetType.CHARGING)
							{
								totalCountCharging++;
							}

							if (entry.address)
							{
								const { zipCode, city, district, road } = extractLocationInfo(entry.address);

								const baseLocation = [zipCode, city, district].filter(Boolean).join("");
								if (baseLocation)
								{
									blockData.locations.push(baseLocation);
									bucketData.locations.add(baseLocation);
								}

								if (road)
								{
									const locationWithRoad = [baseLocation, cleanRoad(road)].filter(Boolean).join("");

									blockData.locations.push(locationWithRoad);
									bucketData.locations.add(locationWithRoad);
								}
							}
						}

						blockData.locations = Array.from(new Set(blockData.locations));

						bucketData.blocks.set(blockId, blockData);
					}
				}
			}
		}
	}

	// --- 階段 2：產出分級索引檔 ---
	const indexRoot = path.join(dataRoot, 'index');
	const activeBuckets: string[] = [];

	let activeBucketsLng: string[] = [];

	let lastLng: string;

	for (const [bucketKey, info] of bucketMap)
	{
		const [lng, lat] = bucketKey.split('/');

		lastLng ??= lng;

		if (lng !== lastLng)
		{
			await mkdir(path.join(indexRoot, lastLng), { recursive: true });

			await writeFile(
				path.join(indexRoot, lastLng, 'index.json'),
				JSON.stringify({ activeBuckets: activeBucketsLng }, null, 2),
			);

			activeBucketsLng = [];
			lastLng = lng;
		}

		activeBucketsLng.push(bucketKey);

		const bucketOutDir = path.join(indexRoot, bucketKey);

		const bucketIndex: IMetadataBucketIndex = {

			locations: Array.from(info.locations).sort(),
			activeBlocks: Array.from(info.blocks.keys()).sort() as any[],
			data: Object.fromEntries(info.blocks),

		};

		await writeFile(
			path.join(bucketOutDir, 'index.json'),
			JSON.stringify(bucketIndex, null, 2),
		);

		activeBuckets.push(bucketKey);
	}

	// --- 階段 3：產出全局 Manifest ---
	await writeFile(
		path.join(dataRoot, 'grid-index.json'),
		JSON.stringify({ activeBuckets: activeBuckets.sort() }, null, 2),
	);

	console.log('🚀 多級索引建立完成！');

	console.log('📊 總資料筆數:', totalCount);
	console.log('📊 Wi-Fi 資料筆數:', totalCountWifi);
	console.log('📊 充電站資料筆數:', totalCountCharging);
}
