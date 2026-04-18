import { IGpsCoordinate } from './grid-types';
import {
	IFormatBlockKey,
	_formatBlockKey,
	calcCoordToBucketIndexAndCoord,
	calcGlobalBlockIndexAndCoord,
} from './grid-utils-global';
import { ITSGenerator } from 'ts-type';

/**
 * 分組結果的結構
 * Record<BucketPath, Record<FileName, DataArray>>
 */
export type ISplitResult<T> = Record<IFormatBlockKey<'/'>, ISplitResultEntry<T>>;

export type ISplitResultEntry<T> = Record<IFormatBlockKey<'_'>, T[]>;

export type IValueArrayOrIterable<T> = T[] | Iterable<T>;

/**
 * 基於 L1 層級切割資料陣列
 */
export function* splitDataByL1GridGenerator<T extends IGpsCoordinate>(data: IValueArrayOrIterable<T>): ITSGenerator<[IFormatBlockKey<'/'>, IFormatBlockKey<'_'>, T[]]>
{
	let lastBucketPath: IFormatBlockKey<'/'>;
	let lastFileName: IFormatBlockKey<'_'>;
	let lastData: T[] = [];

	for (const item of data)
	{
		if (!item)
		{
			continue;
		}

		if (!item.lat && !item.lng)
		{
			throw new TypeError(`Invalid coordinate: ${JSON.stringify(item)}`);
		}

		// 1. 取得 L1 資料夾路徑 (例如: "lng_121.20/lat_24.90")
		const bucketData = calcCoordToBucketIndexAndCoord(item);

		const bucketPath = _formatBlockKey(bucketData.bucketCoord.lng, bucketData.bucketCoord.lat, {
			sep: '/',
		});

		// 2. 取得 L0 檔案名稱 (例如: "121.2200_24.9200")
		const blockData = calcGlobalBlockIndexAndCoord(item);

		const fileName = _formatBlockKey(blockData.minLng, blockData.minLat);

		// @ts-ignore
		if (lastBucketPath === bucketPath && lastFileName === fileName)
		{
			lastData.push(item);
			continue;
		}

		if (lastData.length)
		{
			// @ts-ignore
			yield [lastBucketPath, lastFileName, lastData];
		}

		lastBucketPath = bucketPath;
		lastFileName = fileName;
		lastData = [item];
	}

	if (lastData.length)
	{
		// @ts-ignore
		yield [lastBucketPath, lastFileName, lastData];
	}

	return undefined as any;
}

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
