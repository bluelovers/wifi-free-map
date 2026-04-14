import { IGpsCoordinate } from './grid-types';
import { _formatBlockKey, calcCoordToBucketCoord, calcGlobalBlockIndex } from './grid-utils-global';

/**
 * 分組結果的結構
 * Record<BucketPath, Record<FileName, DataArray>>
 */
export type ISplitResult<T> = Record<string, Record<string, T[]>>;

/**
 * 基於 L1 層級切割資料陣列
 */
export function splitDataByL1Grid<T extends IGpsCoordinate>(data: T[]): ISplitResult<T>
{
	const result: ISplitResult<T> = {};

	for (const item of data)
	{
		// 1. 取得 L1 資料夾路徑 (例如: "lng_121.20/lat_24.90")
		const bucketData = calcCoordToBucketCoord(item);

		const bucketPath = _formatBlockKey(bucketData.bucketCoord.lng, bucketData.bucketCoord.lat);

		// 2. 取得 L0 檔案名稱 (例如: "121.2200_24.9200")
		const blockData = calcGlobalBlockIndex(item);

		const fileName = _formatBlockKey(blockData.minLng, blockData.minLat);

		// 3. 初始化結構
		result[bucketPath] ??= {};
		result[bucketPath][fileName] ??= [];

		// 4. 將資料放入對應的「抽屜」
		result[bucketPath][fileName].push(item);
	}

	return result;
}
