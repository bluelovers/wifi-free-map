/**
 * 全球網格通用工具
 * Global grid utilities for geographic data processing.
 *
 * 提供全球通用的座標轉區塊 ID 計算與格式化的共用具。
 * Provides global utilities for coordinate-to-block ID calculation and formatting.
 */
import { BLOCK_SIZE, TAIWAN_BOUNDS } from './grid-const';
import {
	IBounds,
	IGpsBlockIndex,
	IGpsCoordinate, IGpsLngLatMax,
	IGpsLngLatMin,
	IGpsLngLatMinMax,
	IGpsRowColStartEnd,
} from './grid-types';

/**
 * 全球網格配置：原點
 * Global grid configuration: origin
 *
 * 全球通用網格配置，建議使用 (0,0) 或 (-180, -90) 作為全球唯一原點，這樣最直覺
 * 如果想沿用你原本的台灣設定也完全沒問題
 *
 * Global universal grid configuration, recommend using (0,0) or (-180, -90) as global origin for intuitiveness
 * Using original Taiwan settings is also fine
 */
export const GLOBAL_GRID_CONFIG_ORIGIN = {
	lng: TAIWAN_BOUNDS.minLng,
	lat: TAIWAN_BOUNDS.minLat,
} as const;

/** 座標精度（小數位數）/ Coordinate precision (decimal places) */
export const GLOBAL_GRID_CONFIG_PRECISION = 4 as const;

/** 浮點數 epsilon 值用於修正計算誤差 / Float epsilon value for correcting calculation errors */
export const GLOBAL_GRID_CONFIG_EPSILON = 1e-9 as const;

/**
 * 擴充配置：分流設定
 * Extended configuration: shunting/diversion settings
 *
 * 15x15 個區塊為一組
 * 15x15 blocks as a group
 *
 * 根據地理資訊，台北市的極值大約如下：
 * According to geographic information, Taipei City extremes approximately:
 * - 緯度 (Lat)：24.961° ~ 25.210°（跨度約 0.249°）
 * - 經度 (Lng)：121.457° ~ 121.666°（跨度約 0.209°）
 *
 * 台北市的座標範圍大約 11x13 個區塊
 * Taipei City coordinate range approximately 11x13 blocks
 *
 * 層級規模換算表 / Level scale conversion table:
 * | 層級 (Level) | 跨度 (度) | 物理尺寸 (約略) | 覆蓋能力範例 |
 * | L0 (底層)    | 0.02°     | 2.1 km          | 西門町、萬華車站周邊 |
 * | L1 (資料夾層) | 0.30°    | 32 km           | 台北市 + 新北市核心區 |
 * | L2 (區域層)  | 4.50°    | 480 km          | 全台灣 (南北約 3.5°) |
 * | L3 (跨國層)  | 67.5°    | 7,200 km        | 整個中國 + 大部分東南亞 |
 *
 * 基於此，我們可以設定 15x15 個區塊為一組
 * Based on this, we set 15x15 blocks as a group
 */
export const BUCKET_CONFIG_GROUP_SIZE = 15 as const;

/**
 * 全球通用：座標轉區塊 ID
 * Global universal: coordinate to block ID
 *
 * 不論給入哪裡的座標，都會自動對齊到 GLOBAL_GRID_CONFIG_ORIGIN 出發的全球網格
 * No matter where coordinates are entered, they will automatically align to the global grid starting from GLOBAL_GRID_CONFIG_ORIGIN
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns 區塊索引與左下角座標 / Block index and bottom-left coordinates
 */
export function calcGlobalBlockIndexAndCoord({ lng, lat }: IGpsCoordinate): IGpsBlockIndex & IGpsLngLatMin
{
	/**
	 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
	 * Core formula: Regardless of positive/negative, floor can correctly find the "minimum boundary" of that block
	 */
	const { xIdx, yIdx } = _calcCoordToBlockIndex({ lng, lat });

	/**
	 * 算出該區塊的左下角座標
	 * Calculate the bottom-left coordinates of that block
	 */
	const { minLng, minLat } = _calcBlockIndexToCoord({ xIdx, yIdx });

	return {
		xIdx,
		yIdx,
		minLng,
		minLat,
	};
};

/**
 * 格式化區塊鍵值類型
 * Format block key type
 *
 * @example IFormatBlockKey<'_'> = "121.2200_24.9200"
 * @example IFormatBlockKey<'/'> = "lng_121.20/lat_24.90"
 */
export type IFormatBlockKey<S extends string = '_'> = `${number}${S}${number}`;

/**
 * 格式化區塊鍵值
 * Format block key
 *
 * 將座標轉換為格式化的鍵值字串
 * Converts coordinates to formatted key string
 *
 * @param x_lng - X 座標（經度）/ X coordinate (longitude)
 * @param y_lat - Y 座標（緯度）/ Y coordinate (latitude)
 * @param opts - 選項 / Options
 * @param opts.sep - 分隔符（預設 "_"）/ Separator (default "_")
 * @returns 格式化後的鍵值 / Formatted key
 */
export function _formatBlockKey<S extends string = '_'>(x_lng: number | string, y_lat: number | string, opts?: {
	sep?: S;
}): IFormatBlockKey<S>
{
	const lngStr = typeof x_lng === 'number' ? x_lng.toFixed(GLOBAL_GRID_CONFIG_PRECISION) : x_lng;
	const latStr = typeof y_lat === 'number' ? y_lat.toFixed(GLOBAL_GRID_CONFIG_PRECISION) : y_lat;

	const sep = opts?.sep ?? '_';

	return `${lngStr}${sep}${latStr}` as IFormatBlockKey<S>;
}

/**
 * 核心公式：座標轉區塊索引（單一維度）
 * Core formula: coordinate to block index (single dimension)
 *
 * 不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 * Regardless of positive/negative, floor can correctly find the "minimum boundary" of that block
 *
 * @param current - 當前座標 / Current coordinate
 * @param base - 基準座標（原點）/ Base coordinate (origin)
 * @returns 區塊索引 / Block index
 */
export function _calCoordToBlockIndexCore(current: number, base: number)
{
	return Math.floor((current - base + GLOBAL_GRID_CONFIG_EPSILON) / BLOCK_SIZE);
}

/**
 * 座標轉區塊索引
 * Coordinate to block index
 *
 * 將 GPS 座標轉換為區塊索引
 * Converts GPS coordinates to block index
 *
 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 * Core formula: Regardless of positive/negative, floor can correctly find the "minimum boundary" of that block
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns 區塊索引 / Block index
 */
export function _calcCoordToBlockIndex({ lng, lat }: IGpsCoordinate): IGpsBlockIndex
{
	const xIdx = _calCoordToBlockIndexCore(lng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const yIdx = _calCoordToBlockIndexCore(lat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	return { xIdx, yIdx };
}

/**
 * 區塊索引轉座標（單一維度）
 * Block index to coordinate (single dimension)
 *
 * 算出該區塊的左下角座標
 * Calculates the bottom-left coordinates of that block
 *
 * @param idx - 區塊索引 / Block index
 * @param base - 基準座標（原點）/ Base coordinate (origin)
 * @returns 座標值 / Coordinate value
 */
export function _calcBlockIndexToCoordCore(idx: number, base: number)
{
	return parseFloat((base + idx * BLOCK_SIZE).toFixed(GLOBAL_GRID_CONFIG_PRECISION))
}

/**
 * 區塊索引轉座標
 * Block index to coordinate
 *
 * 將區塊索引轉換為左下角座標
 * Converts block index to bottom-left coordinates
 *
 * @param indices - 區塊索引 / Block index
 * @returns 左下角座標 / Bottom-left coordinates
 */
export function _calcBlockIndexToCoord({ xIdx, yIdx }: IGpsBlockIndex): IGpsLngLatMin
{
	const minLng = _calcBlockIndexToCoordCore(xIdx, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const minLat = _calcBlockIndexToCoordCore(yIdx, GLOBAL_GRID_CONFIG_ORIGIN.lat);

	return {
		minLng,
		minLat,
	};
}

/**
 * 計算矩形範圍內的區塊 IDs
 * Calculate block IDs within a rectangular range
 *
 * 這個函式保證結果只會是 1, 2, 4 (或更多，取決於 range 大小，但一定是矩形數量)
 * This function guarantees results will only be 1, 2, 4 (or more, depending on range size, but definitely rectangular quantity)
 *
 * @param range - 座標範圍 / Coordinate range
 * @returns 區塊索引邊界與匹配的區塊 / Block index bounds and matched blocks
 */
export function calcBlockIdsInRange(range: IGpsLngLatMinMax)
{
	const idBounds = _getBlockIdsInRangeCore(range);

	const matchedBlocks = _detectIdBoundsMatchedBlock(idBounds);

	return {
		idBounds,
		matchedBlocks,
	};
};

/**
 * 區塊索引邊界起止介面
 * Block index bounds start/end interface
 */
export interface IBlockIndexBoundsStartEnd
{
	/** X lng 方向（經度）索引最小值 / X direction (longitude) index minimum */
	startX: number;
	/** X lng 方向（經度）索引最大值 / X direction (longitude) index maximum */
	endX: number;
	/** Y lat 方向（緯度）索引最小值 / Y direction (latitude) index minimum */
	startY: number;
	/** Y lat 方向（緯度）索引最大值 / Y direction (latitude) index maximum */
	endY: number;
}

/**
 * 計算矩形範圍內的區塊索引邊界（核心函式）
 * Calculate block index bounds within rectangular range (core function)
 *
 * 這個函式保證結果只會是 1, 2, 4 (或更多，取決於 range 大小，但一定是矩形數量)
 * This function guarantees results will only be 1, 2, 4 (or more, depending on range size, but definitely rectangular quantity)
 *
 * @param range - 座標範圍 / Coordinate range
 * @returns 區塊索引邊界 / Block index bounds
 */
export function _getBlockIdsInRangeCore({
	minLng,
	minLat,
	maxLng,
	maxLat,
}: IGpsLngLatMinMax): IBlockIndexBoundsStartEnd
{
	const startX = _calCoordToBlockIndexCore(minLng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const endX = _calCoordToBlockIndexCore(maxLng - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lng);

	const startY = _calCoordToBlockIndexCore(minLat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	const endY = _calCoordToBlockIndexCore(maxLat - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lat);

	return {
		startX,
		endX,
		startY,
		endY,
	};
}

/**
 * 檢測並產生匹配的區塊鍵值
 * Detect and generate matched block keys
 *
 * @param idBounds - 區塊索引邊界 / Block index bounds
 * @returns 匹配的區塊鍵值陣列 / Array of matched block keys
 */
export function _detectIdBoundsMatchedBlock(idBounds: IBlockIndexBoundsStartEnd)
{
	const matchedBlocks: ReturnType<typeof _formatBlockKey>[] = [];

	for (let x = idBounds.startX; x <= idBounds.endX; x++)
	{
		for (let y = idBounds.startY; y <= idBounds.endY; y++)
		{
			const minLng = _calcBlockIndexToCoordCore(x, GLOBAL_GRID_CONFIG_ORIGIN.lng);
			const minLat = _calcBlockIndexToCoordCore(y, GLOBAL_GRID_CONFIG_ORIGIN.lat);
			matchedBlocks.push(_formatBlockKey(minLng, minLat));
		}
	}

	return matchedBlocks;
}

/**
 * 區塊索引邊界轉座標範圍
 * Block index bounds to coordinate range
 *
 * @param idBounds - 區塊索引邊界 / Block index bounds
 * @returns 座標範圍 / Coordinate range
 */
export function _idxBoundsToRange(idBounds: IBlockIndexBoundsStartEnd): IGpsLngLatMinMax
{
	return {
		minLat: _calcBlockIndexToCoordCore(idBounds.startX, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		maxLat: _calcBlockIndexToCoordCore(idBounds.endX, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		minLng: _calcBlockIndexToCoordCore(idBounds.startY, GLOBAL_GRID_CONFIG_ORIGIN.lat),
		maxLng: _calcBlockIndexToCoordCore(idBounds.endY, GLOBAL_GRID_CONFIG_ORIGIN.lat),
	};
}

/**
 * 區塊索引轉座標範圍
 * Block index to coordinate range
 *
 * @param indices - 區塊索引 / Block index
 * @returns 座標範圍 / Coordinate range
 */
export function _idxToRange(indices: IGpsBlockIndex): IGpsLngLatMinMax
{
	const { minLng, minLat } = _calcBlockIndexToCoord(indices);

	return {
		minLat,
		maxLat: minLat + BLOCK_SIZE,
		minLng,
		maxLng: minLng + BLOCK_SIZE,
	};
}

/**
 * 座標範圍轉邊界
 * Coordinate range to bounds
 *
 * 將座標範圍轉換為四角座標邊界
 * Converts coordinate range to four-corner bounds
 *
 * @param range - 座標範圍 / Coordinate range
 * @returns 四角座標邊界 / Four corner coordinates bounds
 */
export function rangeToBounds(range: IGpsLngLatMinMax): IBounds
{
	return {
		/** 西北角座標 / Northwest corner coordinates */
		northWest: fixCoord({
			lng: range.minLng,
			lat: range.maxLat,
		}),
		/** 東北角座標 / Northeast corner coordinates */
		northEast: fixCoord({
			lng: range.maxLng,
			lat: range.maxLat,
		}),
		/** 西南角座標 / Southwest corner coordinates */
		southWest: fixCoord({
			lng: range.minLng,
			lat: range.minLat,
		}),
		/** 東南角座標 / Southeast corner coordinates */
		southEast: fixCoord({
			lng: range.maxLng,
			lat: range.minLat,
		}),
	}
}

/**
 * 邊界轉座標範圍
 * Bounds to coordinate range
 *
 * 將四角座標邊界轉換為座標範圍
 * Converts four-corner bounds to coordinate range
 *
 * @param bounds - 四角座標邊界 / Four corner coordinates bounds
 * @returns 座標範圍 / Coordinate range
 */
export function boundsToRange(bounds: IBounds): IGpsLngLatMinMax
{
	const { minLng, minLat } = _boundsToLngLatMin(bounds);
	const { maxLng, maxLat } = _boundsToLngLatMax(bounds);

	return {
		minLng,
		maxLng,
		minLat,
		maxLat,
	};
}

/**
 * 計算分流資料夾名稱
 * Calculate shunting/folder name
 *
 * 邏輯：先算索引，再將索引除以 15 取整數，得到「組索引」
 * Logic: First calculate index, then divide index by 15 and take integer to get "group index"
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns 區塊索引、組索引、組座標 / Block index, bucket index, bucket coordinates
 */
export function calcCoordToBucketIndexAndCoord(coord: IGpsCoordinate)
{
	/** 計算區塊索引 / Calculate block index */
	const blockIndex = _calcCoordToBlockIndex(coord);

	/** 計算組索引 (Bucket Index) / Calculate group index (Bucket Index) */
	const bucketIndex = _calcBlockIndexToBucketIndex(blockIndex);

	/**
	 * 為了讓資料夾名稱好讀，我們可以將組索引轉回該組的起始座標
	 * For readability, we can convert group index back to the starting coordinates of that group
	 */
	const bucketCoord = _calcBucketCoordByBucketIndex(bucketIndex);

	return {
		blockIndex,
		bucketIndex,
		bucketCoord,
	};
};

/**
 * 計算組起始座標（單一維度）
 * Calculate group starting coordinates (single dimension)
 *
 * @param bucket - 組索引 / Bucket index
 * @param coord - 基準座標 / Base coordinate
 * @returns 組起始座標 / Group starting coordinate
 */
export function _calcBucketCoordByBucketIndexCore(bucket: number, coord: number)
{
	return coord + bucket * (BLOCK_SIZE * BUCKET_CONFIG_GROUP_SIZE);
}

/**
 * 計算組起始座標
 * Calculate group starting coordinates
 *
 * 將組索引轉回該組的起始座標
 * Converts group index back to the starting coordinates of that group
 *
 * @param bucket - 組索引 / Bucket index
 * @returns 組起始座標 / Group starting coordinates
 */
export function _calcBucketCoordByBucketIndex(bucket: { bucketX: number, bucketY: number }): IGpsCoordinate
{
	const bucketLng = _calcBucketCoordByBucketIndexCore(bucket.bucketX, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const bucketLat = _calcBucketCoordByBucketIndexCore(bucket.bucketY, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	return {
		lng: bucketLng,
		lat: bucketLat,
	};
}

/**
 * 計算組索引（單一維度）(Bucket Index)
 * Calculate group index (single dimension) (Bucket Index)
 *
 * @param idx - 區塊索引 / Block index
 * @returns 組索引 / Bucket index
 */
export function _calcBlockIndexToBucketIndexCore(idx: number)
{
	return Math.floor(idx / BUCKET_CONFIG_GROUP_SIZE);
}

/**
 * 計算組索引 (Bucket Index)
 * Calculate group index
 *
 * 將區塊索引除以 BUCKET_CONFIG_GROUP_SIZE (15) 取整數
 * Divides block index by BUCKET_CONFIG_GROUP_SIZE (15) and takes integer
 *
 * @param blockIndex - 區塊索引 / Block index
 * @returns 組索引 / Bucket index
 */
export function _calcBlockIndexToBucketIndex(blockIndex: IGpsBlockIndex)
{
	return {
		bucketX: _calcBlockIndexToBucketIndexCore(blockIndex.xIdx),
		bucketY: _calcBlockIndexToBucketIndexCore(blockIndex.yIdx),
	};
}

/**
 * 座標轉邊界
 * Coordinate to bounds
 *
 * 給予左下角點與區塊大小，回傳四個邊角的座標
 * Given bottom-left point and block size, returns four corner coordinates
 *
 * @param crood - 左下角座標 / Bottom-left coordinate
 * @returns 四角座標邊界 / Four corner bounds
 */
export function calculateCroodToBounds(crood: IGpsCoordinate)
{
	const indices = _calcCoordToBlockIndex(crood);
	const range = _idxToRange(indices);

	return rangeToBounds(range);
}

/**
 * 計算區塊中心點（從左下角座標）
 * Calculate block center (from bottom-left coordinates)
 *
 * 從左下角向中心偏移（加上半個區塊大小）
 * Offset from bottom-left to center (add half block size)
 *
 * @param minLngLat - 左下角座標 / Bottom-left coordinates
 * @returns 中心點座標 / Center coordinates
 */
export function _calculateCenterByAnyPointCore(minLngLat: IGpsLngLatMin)
{
	/** 從左下角向中心偏移 (加上半個區塊大小) / Offset from bottom-left to center (add half block size) */
	const half = _fixCoordCore(BLOCK_SIZE / 2);

	return fixCoord({
		lng: minLngLat.minLng + half,
		lat: minLngLat.minLat + half,
	});
}

/**
 * 計算區塊中心點（從任意座標）
 * Calculate block center (from any coordinate)
 *
 * 給予區塊內「任意座標」，計算該區塊的「中心點」
 * Given "any coordinate" within a block, calculate the "center" of that block
 *
 * @param anyCoord - 任意座標 / Any coordinate
 * @returns 區塊中心點座標 / Block center coordinates
 */
export function calculateCenterByAnyPoint(anyCoord: IGpsCoordinate)
{
	const minLngLat = calcGlobalBlockIndexAndCoord(anyCoord);

	return _calculateCenterByAnyPointCore(minLngLat);
}

/**
 * 座標修正核心（單一數值）
 * Coordinate fix core (single value)
 *
 * 將座標修正到指定精度
 * Fixes coordinate to specified precision
 *
 * @param coord - 座標值 / Coordinate value
 * @returns 修正後的座標值 / Fixed coordinate value
 */
export function _fixCoordCore(coord: number)
{
	return parseFloat(coord.toFixed(GLOBAL_GRID_CONFIG_PRECISION));
}

/**
 * 座標修正
 * Coordinate fix
 *
 * 將 GPS 座標修正到指定精度
 * Fixes GPS coordinates to specified precision
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns 修正後的座標 / Fixed coordinates
 */
export function fixCoord(coord: IGpsCoordinate): IGpsCoordinate
{
	return {
		lng: _fixCoordCore(coord.lng),
		lat: _fixCoordCore(coord.lat),
	};
}

/**
 * 邊界轉最小經緯度
 * Bounds to min longitude/latitude
 *
 * @param bounds - 四角座標邊界 / Four corner bounds
 * @returns 最小經緯度 / Min longitude/latitude
 */
export function _boundsToLngLatMin(bounds: IBounds): IGpsLngLatMin
{
	return {
		minLng: bounds.southWest.lng,
		minLat: bounds.southWest.lat,
	}
}

/**
 * 邊界轉最大經緯度
 * Bounds to max longitude/latitude
 *
 * @param bounds - 四角座標邊界 / Four corner bounds
 * @returns 最大經緯度 / Max longitude/latitude
 */
export function _boundsToLngLatMax(bounds: IBounds): IGpsLngLatMax
{
	return {
		maxLng: bounds.northEast.lng,
		maxLat: bounds.northEast.lat,
	}
}

/**
 * 從任意座標取得完整網格屬性
 * Get complete grid properties from any coordinate
 *
 * 核心：從網格內的「任意座標」推導出完整的網格屬性
 * Core: Derives complete grid properties from "any coordinate" within the grid
 *
 * @param anyCoord - 任意座標 / Any coordinate
 * @returns 網格屬性（路徑、邊界、中心、索引）/ Grid properties (path, bounds, center, indices)
 */
export function getGridSpecsFromAnyPoint(anyCoord: IGpsCoordinate)
{
	const indices = _calcCoordToBlockIndex(anyCoord);
	const range = _idxToRange(indices);

	const bounds = rangeToBounds(range);

	const minLngLat = _boundsToLngLatMin(bounds);

	const center = _calculateCenterByAnyPointCore(minLngLat);

	return {
		blockPath: _formatBlockKey(minLngLat.minLng, minLngLat.minLat),
		bounds,
		center,
		indices,
	};
}
