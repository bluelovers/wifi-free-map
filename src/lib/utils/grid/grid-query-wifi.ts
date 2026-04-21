/**
 * WiFi 資料查詢工具
 * WiFi data query utilities
 *
 * 以定位點查詢區塊內 wifi 資料的統一 API
 * Unified API for querying wifi data within blocks by coordinate
 */
import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
	calcGlobalBlockIndexAndCoord,
	_formatBlockKey,
	calcCoordToBucketIndexAndCoord,
	_fixCoordCore,
} from './grid-utils-global';
import {
	IGpsCoordinate,
	IGpsBucketIndex,
	IGpsLngLatMin,
} from './grid-types';
import { __ROOT as PROJECT_ROOT } from '../../../../test/__root';

/**
 * 查詢選項
 * Query options
 */
export interface IQueryWifiByBlockOptions
{
	/** 是否僅查詢區塊（不含區塊組）/ Query block only (without bucket) */
	blockOnly?: boolean;
	/** 是否僅查詢區塊組（不含區塊）/ Query bucket only (without block) */
	bucketOnly?: boolean;
}

/**
 * 查詢結果
 * Query result
 */
export interface IQueryWifiByBlockResult
{
	/** 查詢的原始座標 / Query coordinate */
	coord: IGpsCoordinate;
	/** 區塊組資訊 / Bucket group info */
	bucket: IGpsLngLatMin & {
		/** 區塊組起始座標 / Bucket group start coordinate */
		coord: IGpsCoordinate;
		/** 區塊組最小經度 / Bucket group min longitude */
		minLng: number;
		/** 區塊組最小緯度 / Bucket group min latitude */
		minLat: number;
		/** 區塊組索引路徑（絕對）/ Bucket group index path (absolute) */
		indexPath: string;
		/** 區塊組索引路徑（相對）/ Bucket group index path (relative) */
		indexPathRelative: string;
	};
	/** 區塊資訊 / Block info */
	block: IGpsLngLatMin & {
		/** 區塊左下角座標 / Block bottom-left coordinate */
		coord: IGpsCoordinate;
		/** 區塊最小經度 / Block min longitude */
		minLng: number;
		/** 區塊最小緯度 / Block min latitude */
		minLat: number;
		/** 區塊資料路徑（絕對）/ Block data path (absolute) */
		dataPath: string;
		/** 區塊資料路徑（相對）/ Block data path (relative) */
		dataPathRelative: string;
	};
	/** 區塊組內的資料筆數 / Bucket group data count */
	bucketDataCount: number;
	/** 區塊內的資料筆數 / Block data count */
	blockDataCount: number;
}

/**
 * 查詢錯誤類型列舉
 * Query error type enumeration
 */
export enum EnumQueryWifiErrorType
{
	/** 區塊資料不存在 / Block data not found */
	BlockDataNotFound = 'BLOCK_DATA_NOT_FOUND',
	/** 區塊組索引不存在 / Bucket index not found */
	BucketIndexNotFound = 'BUCKET_INDEX_NOT_FOUND',
	/** 讀取失敗 / Read failed */
	ReadFailed = 'READ_FAILED',
}

/**
 * 查詢錯誤介面
 * Query error interface
 */
export interface IQueryWifiError extends Error
{
	/** 錯誤類型 / Error type */
	type: EnumQueryWifiErrorType;
	/** 錯誤代碼 / Error code */
	code: number;
	/** 檔案路徑 / File path */
	filePath?: string;
}

/**
 * 專案根目錄
 * Project root directory
 *
 * 使用 _getModuleDir() 取得模組目錄
 * Use _getModuleDir() to get module directory
 */
const DATA_BASE_PATH = join(PROJECT_ROOT, 'public', 'data');

/**
 * 建立區塊資料路徑
 * Build block data path
 *
 * 路徑格式：public/data/grid-wifi/<bucketLng>/<bucketLat>/<blockLng>_<blockLat>.json
 * Path format: public/data/grid-wifi/<bucketLng>/<bucketLat>/<blockLng>_<blockLat>.json
 *
 * @param bucketLng - 區塊組經度（用於目錄）/ Bucket longitude (for directory)
 * @param bucketLat - 區塊組緯度（用於目錄）/ Bucket latitude (for directory)
 * @param blockMinLng - 區塊最小經度 / Block min longitude
 * @param blockMinLat - 區塊最小緯度 / Block min latitude
 * @returns 區塊資料路徑 / Block data path
 */
function _buildBlockDataPath(bucketLng: number, bucketLat: number, blockMinLng: number, blockMinLat: number): string
{
	const blockKey = _formatBlockKey(blockMinLng, blockMinLat);
	return join(DATA_BASE_PATH, 'grid-wifi', _fixCoordCore(bucketLng) as any, _fixCoordCore(bucketLat) as any, `${blockKey}.json`);
}

/**
 * 建立區塊組索引路徑
 * Build bucket index path
 *
 * @param bucketLng - 區塊組經度 / Bucket longitude
 * @param bucketLat - 區塊組緯度 / Bucket latitude
 * @returns 區塊組索引路徑 / Bucket index path
 */
function _buildBucketIndexPath(bucketLng: number, bucketLat: number): string
{
	return join(DATA_BASE_PATH, 'index', _fixCoordCore(bucketLng) as any, _fixCoordCore(bucketLat) as any, 'index.json');
}

/**
 * 檢查檔案是否存在
 * Check if file exists
 *
 * @param filePath - 檔案路徑 / File path
 * @returns 是否存在 / Whether exists
 */
async function _fileExists(filePath: string): Promise<boolean>
{
	try
	{
		await access(filePath);
		return true;
	}
	catch
	{
		return false;
	}
}

/**
 * 以定位點查詢區塊內 wifi 資料
 * Query wifi data by coordinate within block
 *
 * 傳入 GPS 座標，回傳該區塊與區塊組內的 wifi 資料索引
 * Input GPS coordinate, return wifi data index within block and bucket group
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @param options - 查詢選項 / Query options
 * @returns 查詢結果 / Query result
 * @throws IQueryWifiError 當資料不存在或讀取失敗時 / Throws IQueryWifiError when data not found or read failed
 */
export async function queryWifiDataByBlock(
	coord: IGpsCoordinate,
	options?: IQueryWifiByBlockOptions,
): Promise<IQueryWifiByBlockResult>
{
	/** 計算區塊資訊 / Calculate block info */
	const blockData = calcGlobalBlockIndexAndCoord(coord);

	/** 計算區塊組資訊 / Calculate bucket info */
	const bucketData = calcCoordToBucketIndexAndCoord(coord);

	/** 格式化區塊鍵值 / Format block key */
	const blockKey = _formatBlockKey(blockData.minLng, blockData.minLat);

	/** 建立區塊組索引路徑 / Build bucket index path */
	const bucketIndexPath = _buildBucketIndexPath(bucketData.bucketCoord.lng, bucketData.bucketCoord.lat);

	/** 建立區塊資料路徑 / Build block data path */
	const blockDataPath = _buildBlockDataPath(
		bucketData.bucketCoord.lng,
		bucketData.bucketCoord.lat,
		blockData.minLng,
		blockData.minLat,
	);

	/** 預設結果 / Default result */
	const result: IQueryWifiByBlockResult = {
		coord,
		bucket: {
			coord: bucketData.bucketCoord,
			minLng: bucketData.bucketCoord.lng,
			minLat: bucketData.bucketCoord.lat,
			indexPath: bucketIndexPath,
			indexPathRelative: join('data', 'index', bucketData.bucketCoord.lng.toFixed(4), bucketData.bucketCoord.lat.toFixed(4), 'index.json'),
		},
		block: {
			coord: { lng: blockData.minLng, lat: blockData.minLat },
			minLng: blockData.minLng,
			minLat: blockData.minLat,
			dataPath: blockDataPath,
			dataPathRelative: join('data', 'grid-wifi', bucketData.bucketCoord.lng.toFixed(4), bucketData.bucketCoord.lat.toFixed(4), `${blockKey}.json`),
		},
		bucketDataCount: 0,
		blockDataCount: 0,
	};

	/** 預設不僅查詢區塊 / Default not block only */
	const blockOnly = options?.blockOnly ?? false;

	/** 預設不僅查詢區塊組 / Default not bucket only */
	const bucketOnly = options?.bucketOnly ?? false;

	/** 若非僅查詢區塊，則讀取區塊組索引 / If not block only, read bucket index */
	if (!blockOnly)
	{
		const bucketExists = await _fileExists(bucketIndexPath);

		if (!bucketExists)
		{
			const error = new Error(`Bucket index not found: ${bucketIndexPath}`) as IQueryWifiError;
			error.type = EnumQueryWifiErrorType.BucketIndexNotFound;
			error.code = 404;
			error.filePath = bucketIndexPath;
			throw error;
		}

		/** 讀取區塊組索引 / Read bucket index */
		const indexContent = await readFile(bucketIndexPath, 'utf-8');
		const indexData = JSON.parse(indexContent);

		/** 取得區塊組內的 activeBlocks 數量 / Get active blocks count in bucket */
		result.bucketDataCount = Array.isArray(indexData.activeBlocks) ? indexData.activeBlocks.length : 0;
	}

	/** 若非僅查詢區塊組，則讀取區塊資料 / If not bucket only, read block data */
	if (!bucketOnly)
	{
		const blockExists = await _fileExists(blockDataPath);

		if (!blockExists)
		{
			const error = new Error(`Block data not found: ${blockDataPath}`) as IQueryWifiError;
			error.type = EnumQueryWifiErrorType.BlockDataNotFound;
			error.code = 404;
			error.filePath = blockDataPath;
			throw error;
		}

		/** 讀取區塊資料 / Read block data */
		const blockContent = await readFile(blockDataPath, 'utf-8');
		const blockJson = JSON.parse(blockContent);

		/** 取得區塊內的資料筆數 / Get data count in block */
		const wifiData = blockJson.wifi ?? blockJson;
		result.blockDataCount = Array.isArray(wifiData) ? wifiData.length : (wifiData?.data?.length ?? 0);
	}

	return result;
}
