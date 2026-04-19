/**
 * 網格資料分割工具
 * Grid data splitting utilities for geographic data processing.
 *
 * 將地理資料陣列依據網格層級進行分割
 * Splits geographic data arrays according to grid hierarchy
 */
import { IFormatBlockKey, IGpsCoordinate, ISplitResult, IValueArrayOrIterable } from './grid-types';
import { _formatBlockKey, calcCoordToBucketIndexAndCoord, calcGlobalBlockIndexAndCoord } from './grid-utils-global';
import { ITSGenerator } from 'ts-type';

/**
 * 基於 L1 層級切割資料陣列（生成器）
 * Split data array by L1 level (generator)
 *
 * L1 層級為資料夾層（15x15 區塊一組）
 * L1 level is folder layer (15x15 blocks as a group)
 *
 * 範例路徑解析：
 * path: /121.3000/24.9000/121.4800_25.0200.json (萬華艋舺夜市)
 *
 * [結構說明]
 * - L1-Dir-Lng (121.3000): 經度分流，步進 0.3° (15 * 0.02)
 * - L1-Dir-Lat (24.9000): 緯度分流，涵蓋 24.90 ~ 25.20 範圍
 * - L0-File (121.4800_25.0200): 萬華核心網格 $0.02 \times 0.02$
 *
 * [排序行為預期]
 * 所有的萬華資料會先依照 121.3000 (經度桶) 聚集，再依照 24.9000 (緯度桶) 聚集。
 * 因此，若有另一筆資料在 121.2000 桶但緯度更高，它依然會排在萬華之前。
 *
 * @param data - 資料陣列或 Iterable
 * @yield [bucketPath, blockPath, items] - 分組後的資料
 */
export function* splitDataByL1GridGenerator<T extends IGpsCoordinate>(data: IValueArrayOrIterable<T>): ITSGenerator<[IFormatBlockKey<'/'>, IFormatBlockKey<'_'>, T[]]>
{
	/** 上一次的 bucket 路徑 / Previous bucket path */
	let lastBucketPath: IFormatBlockKey<'/'>;
	/** 上一次的檔案名稱 / Previous file name */
	let lastFileName: IFormatBlockKey<'_'>;
	/** 上一次的資料陣列 / Previous data array */
	let lastData: T[] = [];

	for (const item of data)
	{
		/** 跳過空項目 / Skip empty items */
		if (!item)
		{
			continue;
		}

		/** 驗證座標有效性 / Validate coordinate validity */
		if (!item.lat && !item.lng)
		{
			throw new TypeError(`Invalid coordinate: ${JSON.stringify(item)}`);
		}

		/**
		 * 1. 取得 L1 資料夾路徑
		 * Example: "lng_121.20/lat_24.90"
		 */
		const bucketData = calcCoordToBucketIndexAndCoord(item);

		const bucketPath = _formatBlockKey(bucketData.bucketCoord.lng, bucketData.bucketCoord.lat, {
			sep: '/',
		});

		/**
		 * 2. 取得 L0 檔案名稱
		 * Example: "121.2200_24.9200"
		 */
		const blockData = calcGlobalBlockIndexAndCoord(item);

		const fileName = _formatBlockKey(blockData.minLng, blockData.minLat);

		/**
		 * 3. 如果與前一個相同，則累加到同一個陣列
		 * If same as previous, accumulate to same array
		 */
		// @ts-ignore
		if (lastBucketPath === bucketPath && lastFileName === fileName)
		{
			lastData.push(item);
			continue;
		}

		/** 4. 如果不同，yield 前一個結果並開始新的 / If different, yield previous result and start new */
		if (lastData.length)
		{
			// @ts-ignore
			yield [lastBucketPath, lastFileName, lastData];
		}

		lastBucketPath = bucketPath;
		lastFileName = fileName;
		lastData = [item];
	}

	/** 5. Yield 最後一筆資料 / Yield last data */
	if (lastData.length)
	{
		// @ts-ignore
		yield [lastBucketPath, lastFileName, lastData];
	}

	return undefined as any;
}

/**
 * 基於 L1 層級切割資料陣列（同步版本）
 * Split data array by L1 level (sync version)
 *
 * 將生成器結果收集為物件
 * Collects generator results into object
 *
 * @param data - 資料陣列或 Iterable
 * @returns 分組後的結果物件
 *
 * @see splitDataByL1GridGenerator
 */
export function splitDataByL1Grid<T extends IGpsCoordinate>(data: IValueArrayOrIterable<T>): ISplitResult<T>
{
	const resultSplit: ISplitResult<T> = {};

	// @ts-ignore
	for (const result of splitDataByL1GridGenerator(data))
	{
		if (!result?.length)
		{
			continue;
		}

		const [bucketPath, fileName, items] = result;

		resultSplit[bucketPath] ??= {};
		resultSplit[bucketPath][fileName] ??= [];
		resultSplit[bucketPath][fileName].push(...items);
	}

	return resultSplit;
}
