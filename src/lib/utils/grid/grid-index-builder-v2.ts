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
 * 區塊組索引元資料介面
 * Bucket group index metadata interface
 *
 * 描述單一區塊組（Bucket）的索引結構
 * Describes the index structure for a single bucket group
 *
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
	 * 該 Bucket 下實際存在的 Block ID
	 * Active block IDs in this bucket
	 *
	 * (e.g., "121.4800_25.0200")
	 */
	activeBlocks: IFormatBlockKey<'_'>[];

	/** 行政區集合 / Administrative area locations */
	locations: string[];

	/** 核心資料：以 blockId 為 Key / Core data: keyed by blockId */
	data: Record<IFormatBlockKey<'_'>, IMetadataUnifiedBlockIndex>;
}

/**
 * 統一區塊索引元資料介面
 * Unified block index metadata interface
 *
 * 描述單一區塊的索引結構
 * Describes the index structure for a single block
 */
export interface IMetadataUnifiedBlockIndex
{
	/**
	 * 該 Block 涵蓋的行政區
	 * Administrative areas covered by this block
	 *
	 * (optional, for detailed filtering)
	 */
	locations: string[];
	/** 該 Block 擁有的不同類型資料集 / Data sets owned by this block */
	dataset: Record<EnumDatasetType, { fileName: string }>;
}

/**
 * 建立區塊聚合器 V2
 * Create block aggregator V2
 *
 * 將資料依據 L1 網格進行分割與聚合
 * Splits and aggregates data according to L1 grid
 *
 * @param inputAndOptions - 輸入資料與選項 / Input data and options
 * @param inputAndOptions.data - 資料陣列或 Iterable / Data array or Iterable
 * @param inputAndOptions.normalize - 資料正規化函式（可選）/ Data normalization function (optional)
 * @returns 區塊聚合結果 / Block aggregation result
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


	/**
	 * 使用生成器分割資料 / Split data using generator
	 */
	// @ts-ignore
	for (const result of splitDataByL1GridGenerator(inputAndOptions.data))
	{
		if (!result) continue;

		const [bucketPath, blockPath, items] = result;

		/** 初始化 bucket 路徑記錄 / Initialize bucket path record */
		recordSplit[bucketPath] ??= {};
		/** 初始化 block 路徑記錄 / Initialize block path record */
		recordSplit[bucketPath][blockPath] ??= [];

		const normalizedItems: R[] = recordSplit[bucketPath][blockPath];

		/**
		 * 使用正規化函式處理每個項目
		 * Normalize each item using normalization function
		 */
		if (inputAndOptions.normalize)
		{
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
 * 建立多級導航索引
 * Build hierarchical navigation index
 *
 * 掃描實體資料檔案並產生三級導航索引結構
 * Scans entity data files and generates triple-level navigation index structure
 *
 * @param dataRoot - 資料根目錄 / Data root directory
 *
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
	/** 資料類型列表 / Data type list */
	const types = [EnumDatasetType.WIFI, EnumDatasetType.CHARGING];

	/**
	 * 用於儲存彙整後的 Bucket 資訊
	 * Used to store aggregated bucket information
	 *
	 * Key 格式: "121.3000/24.9000"
	 */
	const bucketMap = new Map<string, {
		locations: Set<string>,
		types: Set<EnumDatasetType>,
		blocks: Map<IFormatBlockKey<'_'>, IMetadataUnifiedBlockIndex>
	}>();

	/** 統計：總資料筆數 / Statistics: total data count */
	let totalCount = 0;
	/** 統計：Wi-Fi 資料筆數 / Statistics: Wi-Fi data count */
	let totalCountWifi = 0;
	/** 統計：充電站資料筆數 / Statistics: charging station data count */
	let totalCountCharging = 0;

	/** ==================== 階段 1：掃描實體檔案並彙整 / Stage 1: Scan entity files and aggregate ==================== */

	/**
	 * 遍歷所有資料類型
	 * Iterate through all data types
	 */
	for (const type of types)
	{
		/** 構建類型資料夾路徑 / Build type folder path */
		const typeFolderPath = `grid-${type.toLowerCase()}`;
		const typeFolder = path.join(dataRoot, typeFolderPath);

		/** 檢查資料夾是否存在 / Check if folder exists */
		if (!(await exists(typeFolder))) continue;

		/** 取得經度方向的所有資料夾 / Get all longitude directories */
		const lngDirs = await opendir(typeFolder);

		/** 遍歷經度方向資料夾 / Iterate through longitude directories */
		for await (const lngDir of lngDirs)
		{
			const latPath = path.join(typeFolder, lngDir.name);
			/** 跳過非資料夾項目 / Skip non-directory items */
			if (!lngDir.isDirectory()) continue;

			/** 取得緯度方向的所有資料夾 / Get all latitude directories */
			const latDirs = await opendir(latPath);

			/** 遍歷緯度方向資料夾 / Iterate through latitude directories */
			for await (const latDir of latDirs)
			{
				/** 建立區塊組 Key / Build bucket key */
				const bucketKey = _formatBlockKey(lngDir.name, latDir.name, { sep: '/' });
				/** 建立區塊資料夾路徑 / Build block folder path */
				const blockPath = path.join(latPath, latDir.name);
				/** 取得區塊資料夾內的所有檔案 / Get all files in block folder */
				const files = await opendir(blockPath);

				/** 初始化區塊組資料 / Initialize bucket data if not exists */
				if (!bucketMap.has(bucketKey))
				{
					bucketMap.set(bucketKey, {
						locations: new Set(),
						types: new Set(),
						blocks: new Map(),
					});
				}

				/** 取得區塊組資料 / Get bucket data */
				const bucketData = bucketMap.get(bucketKey)!;
				/** 記錄區塊組擁有的資料類型 / Record data types owned by bucket */
				bucketData.types.add(type);

				/** 遍歷區塊內的所有檔案 / Iterate through all files in block */
				for await (const file of files)
				{
					/** 跳過非檔案項目 / Skip non-file items */
					if (!file.isFile()) continue;

					/** 解析檔案名稱 / Parse file name */
					let p = path.parse(file.name);

					/** 處理 JSON 檔案（排除 index.json）/ Process JSON files (exclude index.json) */
					if (p.ext === '.json' && p.name !== 'index')
					{
						/** 取得區塊 ID / Get block ID */
						const blockId = p.name as IFormatBlockKey<'_'>;

						/** 取得或建立區塊資料 / Get or create block data */
						const blockData: IMetadataUnifiedBlockIndex = bucketData.blocks.get(blockId) ?? {
							locations: [],
							dataset: {} as any,
						};

						/** 記錄區塊擁有的資料集 / Record dataset owned by block */
						blockData.dataset[type] = {
							fileName: path.join(typeFolderPath, lngDir.name, latDir.name, file.name),
						};

						/** 讀取區塊檔案內容 / Read block file content */
						const fileContent = await readFile(path.join(blockPath, file.name), 'utf-8').then(JSON.parse);

						/**
						 * 處理位置資訊
						 * Process location information
						 *
						 * 從每筆資料中提取地址資訊並彙整
						 * Extract address info from each record and aggregate
						 */
						for (const entry of fileContent)
						{
							/** 累計總筆數 / Increment total count */
							totalCount++;
							/** 統計各類型筆數 / Count each type */
							if (type === EnumDatasetType.WIFI)
							{
								totalCountWifi++;
							}
							else if (type === EnumDatasetType.CHARGING)
							{
								totalCountCharging++;
							}

							/** 處理地址資訊 / Process address information */
							if (entry.address)
							{
								/** 解析地址取得各組成部分 / Parse address to get components */
								const { zipCode, city, district, road } = extractLocationInfo(entry.address);

								/** 建立基本位置字串（郵遞區號+縣市+區）/ Build base location string */
								const baseLocation = [zipCode, city, district].filter(Boolean).join("");
								if (baseLocation)
								{
									/** 記錄到區塊和區塊組 / Record to block and bucket */
									blockData.locations.push(baseLocation);
									bucketData.locations.add(baseLocation);
								}

								/** 如果有路名，建立完整位置字串 / Build full location if road exists */
								if (road)
								{
									const locationWithRoad = [baseLocation, cleanRoad(road)].filter(Boolean).join("");

									blockData.locations.push(locationWithRoad);
									bucketData.locations.add(locationWithRoad);
								}
							}
						}

						/** 去重並設定位置資訊 / Deduplicate and set location info */
						blockData.locations = Array.from(new Set(blockData.locations));

						/** 設定區塊資料 / Set block data */
						bucketData.blocks.set(blockId, blockData);
					}
				}
			}
		}
	}

	/** ==================== 階段 2：產出分級索引檔 / Stage 2: Generate hierarchical index files ==================== */

	/** 建立索引根目錄 / Create index root directory */
	const indexRoot = path.join(dataRoot, 'index');
	/** 記錄所有活躍的區塊組 / Record all active buckets */
	const activeBuckets: string[] = [];

	/** 記錄當前經度的活躍區塊組 / Record active buckets for current longitude */
	let activeBucketsLng: string[] = [];

	/** 記錄上一個處理的經度值 / Record last processed longitude */
	let lastLng: string;

	/** 遍歷所有區塊組 / Iterate through all buckets */
	for (const [bucketKey, info] of bucketMap)
	{
		/** 解析區塊組 Key 取得經緯度 / Parse bucket key to get longitude and latitude */
		const [lng, lat] = bucketKey.split('/');

		/** 初始化第一個經度值 / Initialize first longitude value */
		lastLng ??= lng;

		/** 當經度變更時，產出前一經度的索引檔 / When longitude changes, output previous longitude index file */
		if (lng !== lastLng)
		{
			/** 建立經度資料夾 / Create longitude directory */
			await mkdir(path.join(indexRoot, lastLng), { recursive: true });

			/** 寫入 L2 層級索引 / Write L2 level index */
			await writeFile(
				path.join(indexRoot, lastLng, 'index.json'),
				JSON.stringify({ activeBuckets: activeBucketsLng }, null, 2),
			);

			/** 重置當前經度的區塊組列表 / Reset current longitude bucket list */
			activeBucketsLng = [];
			/** 更新上一個經度值 / Update last longitude value */
			lastLng = lng;
		}

		/** 將區塊組加入當前經度列表 / Add bucket to current longitude list */
		activeBucketsLng.push(bucketKey);

		/** 建立區塊組輸出目錄 / Create bucket output directory */
		const bucketOutDir = path.join(indexRoot, bucketKey);

		/** 構建區塊組索引結構 / Build bucket index structure */
		const bucketIndex: IMetadataBucketIndex = {
			/** 排序後的行政區列表 / Sorted location list */
			locations: Array.from(info.locations).sort(),
			/** 排序後的活躍區塊列表 / Sorted active block list */
			activeBlocks: Array.from(info.blocks.keys()).sort() as any[],
			/** 區塊詳細資料 / Block details */
			data: Object.fromEntries(info.blocks),
		};

		/** 寫入 L3 層級索引 / Write L3 level index */
		await writeFile(
			path.join(bucketOutDir, 'index.json'),
			JSON.stringify(bucketIndex, null, 2),
		);

		/** 記錄活躍區塊組 / Record active bucket */
		activeBuckets.push(bucketKey);
	}

	/** ==================== 階段 3：產出全局 Manifest / Stage 3: Generate global Manifest ==================== */

	/** 寫入全局索引 Manifest / Write global index manifest */
	await writeFile(
		path.join(dataRoot, 'grid-index.json'),
		JSON.stringify({ activeBuckets: activeBuckets.sort() }, null, 2),
	);

	/** 輸出完成訊息 / Output completion message */
	console.log('🚀 多級索引建立完成！');

	console.log('📊 總資料筆數:', totalCount);
	console.log('📊 Wi-Fi 資料筆數:', totalCountWifi);
	console.log('📊 充電站資料筆數:', totalCountCharging);
}
