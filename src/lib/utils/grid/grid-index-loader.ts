/**
 * 網格索引載入器
 * Grid index loader
 *
 * 提供統一的函式來讀取 Bucket Index 與 Block Index 的 JSON 檔案
 * Provides unified functions for reading Bucket Index and Block Index JSON files
 */
import { readJSON } from 'fs-extra';
import { IMetadataBucketIndex, IMetadataUnifiedBlockIndex } from './grid-index-builder-v2';
import { EnumDatasetType, IFormatBlockKey, IGeoCoord, IGridBlockIndexFileName } from './grid-types';
import { getBucketSpecsFromAnyPoint } from './grid-utils-global';
import { readFile } from 'fs/promises';
import { join, resolve } from 'upath2';
import { __DATA_ROOT } from '@/lib/__root';
import { IGridBlockIndexData } from '@/types/index';

/**
 * 讀取 JSON 檔案並解析為指定型別
 * Read JSON file and parse to specified type
 *
 * @param file - 檔案路徑 / File path
 * @returns 解析後的型別資料 / Parsed type data
 */
export function _readJSON<T>(file: string)
{
	return readFile(file, 'utf-8').then(data => JSON.parse(data) as T)
}

/**
 * 取得 Bucket Index 目錄路徑
 * Get bucket index directory path
 *
 * @param bucketPath - Bucket 路徑 / Bucket path
 * @returns 索引目錄路徑 / Index directory path
 */
export function getBucketIndexPathDir(bucketPath: string)
{
	return join('index', bucketPath) as `index/${IFormatBlockKey<'/'>}`;
}

/**
 * 取得 Bucket Index JSON 檔案路徑
 * Get bucket index JSON file path
 *
 * @param bucketPath - Bucket 路徑 / Bucket path
 * @returns 完整 JSON 檔案路徑 / Complete JSON file path
 */
export function getBucketIndexPathJSON(bucketPath: string)
{
	return join(getBucketIndexPathDir(bucketPath), 'index.json') as `${ReturnType<typeof getBucketIndexPathDir>}/index.json`;
}

/**
 * 載入 Bucket Index JSON
 * Load bucket index JSON
 *
 * 從指定路徑讀取並解析 Bucket Index 資料
 * Reads and parses bucket index data from the specified path
 *
 * @param bucketIndexPath - Bucket 索引路徑 / Bucket index path
 * @returns Bucket 索引資料 / Bucket index data
 */
export async function loadBucketIndexJSON(bucketIndexPath: string)
{
	const file= resolve(__DATA_ROOT, bucketIndexPath);

	const bucketIndexData = await _readJSON<IMetadataBucketIndex>(file);

	return bucketIndexData;
}

/**
 * 取得 Block Index JSON 檔案路徑
 * Get block index JSON file path
 *
 * 根據區塊路徑與資料類型組合出完整的 Block Index 檔案路徑
 * Composes the full block index file path based on block path and dataset type
 *
 * @param args - 區塊路徑與 Bucket 路徑 / Block path and bucket path
 * @param args.blockPath - Block 路徑（以 '_' 分隔）/ Block path (separated by '_')
 * @param args.bucketPath - Bucket 路徑（以 '/' 分隔）/ Bucket path (separated by '/')
 * @param dataType - 資料類型 / Dataset type
 * @returns Block Index 檔案路徑 / Block index file path
 */
export function getBlockIndexPathJSON<T extends EnumDatasetType>(args: {
	blockPath: IFormatBlockKey<'_'>,
	bucketPath: IFormatBlockKey<'/'>,
}, dataType: T)
{
	return join(`grid-${dataType}`, args.bucketPath, args.blockPath) as IGridBlockIndexFileName<T>;
}

/**
 * 載入 Block Index JSON
 * Load block index JSON
 *
 * 從指定路徑讀取並解析指定資料類型的 Block Index 資料
 * Reads and parses block index data of the specified dataset type from the given path
 *
 * @param blockFilePath - Block 檔案路徑 / Block file path
 * @returns Block 索引資料 / Block index data
 */
export async function loadBlockIndexJSON<T extends EnumDatasetType>(blockFilePath: string)
{
	const file= resolve(__DATA_ROOT, blockFilePath);

	const blockIndexData = await _readJSON<IGridBlockIndexData<T>>(file);

	return blockIndexData;
}

/**
 * 從座標取得 Bucket 索引路徑資訊
 * Get bucket index path info from coordinate
 *
 * 根據給定座標計算出對應的 Block 路徑、Bucket 路徑與 Bucket Index 路徑
 * Calculates the corresponding block path, bucket path, and bucket index path from the given coordinate
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns 路徑資訊 / Path information
 */
export async function getBucketIndexPathInfo(coord: IGeoCoord)
{
	const {
		blockPath,
		bucketPath,
	} = getBucketSpecsFromAnyPoint(coord);

	const bucketIndexPath = getBucketIndexPathJSON(bucketPath);

	return {
		/** Block 路徑 / Block path */
		blockPath,
		/** Bucket 路徑 / Bucket path */
		bucketPath,
		/** Bucket Index JSON 路徑 / Bucket index JSON path */
		bucketIndexPath,
	};
}

/**
 * 載入指定座標的 Bucket Index 資料
 * Load bucket index data for the given coordinate
 *
 * 一鍵載入：從座標推導出路徑，再讀取 Bucket Index JSON
 * One-shot load: derives the path from the coordinate, then reads the bucket index JSON
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns Bucket 索引資料與路徑資訊 / Bucket index data and path information
 */
export async function loadBucketIndexData(coord: IGeoCoord)
{
	const {
		blockPath,
		bucketPath,
		bucketIndexPath,
	} = await getBucketIndexPathInfo(coord);

	const bucketIndexData = await loadBucketIndexJSON(bucketIndexPath);

	return {
		/** Block 路徑 / Block path */
		blockPath,
		/** Bucket 路徑 / Bucket path */
		bucketPath,
		/** Bucket Index JSON 路徑 / Bucket index JSON path */
		bucketIndexPath,
		/** Bucket Index 資料 / Bucket index data */
		bucketIndexData,
	};
}
