/**
 * 全球網格通用工具
 * Global grid utilities for geographic data processing.
 *
 * 提供全球通用的座標轉區塊 ID 計算與格式化的共用具。
 * Provides global utilities for coordinate-to-block ID calculation and formatting.
 */
import {
	BLOCK_SIZE,
	BUCKET_CONFIG_GROUP_SIZE,
	GLOBAL_GRID_CONFIG_EPSILON,
	GLOBAL_GRID_CONFIG_ORIGIN,
	GLOBAL_GRID_CONFIG_PRECISION,
	GLOBAL_GRID_CONFIG_PRECISION_MAKRER,
} from './grid-const';
import {
	IGeoBlockGridIndexRange,
	IFormatBlockKey,
	IGeoCoord,
	IGeoBlockIndex,
	IGeoBucketGridIndex,
	IGpsLngLatMin,
	IGpsLngLatMinMax,
	IMatchedBuckets,
} from './grid-types';
import { _formatBlockKey, decodeBlockKey } from '@/lib/utils/geo/geo-formatter';
import {
	_boundsToLngLatMin,
	_normalizeCoordScalarCore,
	normalizeCoord,
	normalizeLngLatMinMax,
	rangeLngLatMinMaxToBounds,
} from '@/lib/utils/geo/geo-transform';
import { _calcBlockIndexToRangeScalarCore, _calCoordScalarToBlockIndexCore } from '@/lib/utils/grid/grid-transform';
import { expandRangeLngLatMinMax, shrinkRangeLngLatMinMax } from '../geo/geo-bounds-utils';
import { getArrowOffsetToken } from 'antd/es/style/placementArrow';

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
export function calcGlobalBlockIndexAndCoord({ lng, lat }: IGeoCoord): IGeoBlockIndex & IGpsLngLatMin
{
	/**
	 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
	 * Core formula: Regardless of positive/negative, floor can correctly find the "minimum boundary" of that block
	 */
	const { xLngIdx, yLatIdx } = _calcCoordToBlockIndex({ lng, lat });

	/**
	 * 算出該區塊的左下角座標
	 * Calculate the bottom-left coordinates of that block
	 */
	const { minLng, minLat } = _calcBlockIndexToLngLatMin({ xLngIdx, yLatIdx });

	return {
		xLngIdx,
		yLatIdx,
		minLng,
		minLat,
	};
};

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
 * @param anyCrood - GPS 座標 / GPS coordinate
 * @returns 區塊索引 / Block index
 */
export function _calcCoordToBlockIndex(anyCrood: IGeoCoord): IGeoBlockIndex
{
	/** 計算經度方向的區塊索引 / Calculate block index for longitude */
	const xIdx = _calCoordScalarToBlockIndexCore(anyCrood.lng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	/** 計算緯度方向的區塊索引 / Calculate block index for latitude */
	const yIdx = _calCoordScalarToBlockIndexCore(anyCrood.lat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	return { xLngIdx: xIdx, yLatIdx: yIdx };
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
export function _calcBlockIndexToLngLatMin({ xLngIdx, yLatIdx }: IGeoBlockIndex): IGpsLngLatMin
{
	/** 計算經度方向的左下角座標 / Calculate bottom-left coordinate for longitude */
	const minLng = _calcBlockIndexToRangeScalarCore(xLngIdx, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	/** 計算緯度方向的左下角座標 / Calculate bottom-left coordinate for latitude */
	const minLat = _calcBlockIndexToRangeScalarCore(yLatIdx, GLOBAL_GRID_CONFIG_ORIGIN.lat);

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
	/** 計算範圍內的區塊索引邊界 / Calculate block index bounds within the range */
	const idBounds = _getBlockIdsInRangeCore(range);

	/** 檢測並產生匹配的區塊鍵值 / Detect and generate matched block keys */
	const matchedBlocks = _detectIdBoundsMatchedBlock(idBounds);

	return {
		idBounds,
		matchedBlocks,
	};
};

/**
 * 計算矩形範圍內的區塊索引邊界（核心函式）
 * Calculate block index bounds within rectangular range (core function)
 *
 * 這個函式保證結果只會是 1, 2, 4 (或更多，取決於 range 大小，但一定是矩形數量)
 * This function guarantees results will only be 1, 2, 4
 * (or more, depending on range size, but definitely rectangular quantity)
 *
 * @param range - 座標範圍 / Coordinate range
 * @returns 區塊索引邊界 / Block index bounds
 */
export function _getBlockIdsInRangeCore({
	minLng,
	minLat,
	maxLng,
	maxLat,
}: IGpsLngLatMinMax): IGeoBlockGridIndexRange
{
	/** 計算經度方向的起始和結束索引 / Calculate start and end index for longitude */
	const startX = _calCoordScalarToBlockIndexCore(minLng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	/**
	 * 使用 epsilon 確保最大值邊界不包含在下一個區塊
	 * Use epsilon to ensure max boundary is not included in next block
	 */
	const endX = _calCoordScalarToBlockIndexCore(maxLng - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lng);

	/** 計算緯度方向的起始和結束索引 / Calculate start and end index for latitude */
	const startY = _calCoordScalarToBlockIndexCore(minLat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	const endY = _calCoordScalarToBlockIndexCore(maxLat - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lat);

	return {
		xLngIdxStart: startX,
		xLngIdxEnd: endX,
		yLatIdxStart: startY,
		yLatIdxEnd: endY,
	};
}

/**
 * 檢測並產生匹配的區塊鍵值
 * Detect and generate matched block keys
 *
 * 遍歷區塊邊界範圍內的所有區塊索引
 * Iterates through all block indices within the bounds range
 *
 * @param idBounds - 區塊索引邊界 / Block index bounds
 * @returns 匹配的區塊鍵值陣列 / Array of matched block keys
 */
export function _detectIdBoundsMatchedBlock(idBounds: IGeoBlockGridIndexRange)
{
	const matchedBlocks: IFormatBlockKey[] = [];

	/** 遍歷經度方向的所有區塊 / Iterate through all blocks in longitude direction */
	for (let x = idBounds.xLngIdxStart; x <= idBounds.xLngIdxEnd; x++)
	{
		/** 遍歷緯度方向的所有區塊 / Iterate through all blocks in latitude direction */
		for (let y = idBounds.yLatIdxStart; y <= idBounds.yLatIdxEnd; y++)
		{
			/** 計算每個區塊的左下角座標 / Calculate bottom-left coordinate for each block */
			const minLng = _calcBlockIndexToRangeScalarCore(x, GLOBAL_GRID_CONFIG_ORIGIN.lng);
			const minLat = _calcBlockIndexToRangeScalarCore(y, GLOBAL_GRID_CONFIG_ORIGIN.lat);
			matchedBlocks.push(_formatBlockKey(minLng, minLat));
		}
	}

	return matchedBlocks;
}

/**
 * 區塊索引邊界轉座標範圍
 * Block index bounds to coordinate range
 *
 * 將區塊索引邊界轉換為座標範圍
 * Converts block index bounds to coordinate range
 *
 * @param idBounds - 區塊索引邊界 / Block index bounds
 * @returns 座標範圍 / Coordinate range
 */
export function _idxBoundsToRangeLngLatMinMax(idBounds: IGeoBlockGridIndexRange): IGpsLngLatMinMax
{
	/**
	 * 將邊界起始點轉為最小座標
	 * 將邊界結束點轉為最大座標
	 *
	 * Convert boundary start to min coordinates
	 * Convert boundary end to max coordinates
	 */
	return {
		minLat: _calcBlockIndexToRangeScalarCore(idBounds.xLngIdxStart, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		maxLat: _calcBlockIndexToRangeScalarCore(idBounds.xLngIdxEnd, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		minLng: _calcBlockIndexToRangeScalarCore(idBounds.yLatIdxStart, GLOBAL_GRID_CONFIG_ORIGIN.lat),
		maxLng: _calcBlockIndexToRangeScalarCore(idBounds.yLatIdxEnd, GLOBAL_GRID_CONFIG_ORIGIN.lat),
	};
}

/**
 * 區塊索引轉座標範圍
 * Block index to coordinate range
 *
 * 將區塊索引轉換為座標範圍
 * Converts block index to coordinate range
 *
 * @param indices - 區塊索引 / Block index
 * @returns 座標範圍 / Coordinate range
 */
export function _idxToRangeLngLatMinMax(indices: IGeoBlockIndex): IGpsLngLatMinMax
{
	/** 取得區塊的左下角座標 / Get block's bottom-left coordinate */
	const { minLng, minLat } = _calcBlockIndexToLngLatMin(indices);

	return {
		minLat,
		/** 加上區塊大小得到最大緯度 / Add block size to get max latitude */
		maxLat: _normalizeCoordScalarCore(minLat + BLOCK_SIZE),
		minLng,
		/** 加上區塊大小得到最大經度 / Add block size to get max longitude */
		maxLng: _normalizeCoordScalarCore(minLng + BLOCK_SIZE),
	};
}

/**
 * 座標轉座標範圍（可指定區塊數量）
 * Coordinate to coordinate range (with configurable block count)
 *
 * 將座標轉換為包含指定數量區塊的座標範圍
 * Converts coordinate to range containing specified number of blocks
 *
 * @param minLngLat - 左下角座標 / Bottom-left coordinate
 * @param blockCount - 區塊數量（預設 1）/ Block count (default 1)
 * @returns 座標範圍 / Coordinate range
 */
export function _minLngLatToRangeLngLatMinMax(minLngLat: IGpsLngLatMin, blockCount = 1): IGpsLngLatMinMax
{
	const { minLng, minLat } = minLngLat;

	return {
		minLat,
		/** 根據區塊數量計算最大範圍 / Calculate max range based on block count */
		maxLat: minLat + BLOCK_SIZE * blockCount,
		minLng,
		maxLng: minLng + BLOCK_SIZE * blockCount,
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
export function calcCoordToBucketIndexAndCoord(coord: IGeoCoord)
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
 * 計算分流組起始座標（單一維度）
 * Calculate bucket group starting coordinates (single dimension)
 *
 * 將區塊索引轉換為區塊分流組的起始座標
 * Converts block index to bucket group's starting coordinates
 *
 * @param bucket - 分流組索引 / Bucket index
 * @param coord - 基準座標 / Base coordinate
 * @returns 分流組起始座標 / Bucket starting coordinate
 */
export function _calcBucketCoordByBucketIndexCore(bucket: number, coord: number)
{
	/**
	 * 計算公式：基準座標 + 組索引 * (區塊大小 * 區塊組數量)
	 * Calculation: base coordinate + group index * (block size * bucket group size)
	 */
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
export function _calcBucketCoordByBucketIndex(bucket: { bucketX: number, bucketY: number }): IGeoCoord
{
	const bucketLng = _calcBucketCoordByBucketIndexCore(bucket.bucketX, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const bucketLat = _calcBucketCoordByBucketIndexCore(bucket.bucketY, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	return {
		lng: bucketLng,
		lat: bucketLat,
	};
}

/**
 * 計算分流組索引（單一維度）(Bucket Index)
 * Calculate group index (single dimension) (Bucket Index)
 *
 * 將區塊索引除以區塊組大小（15）取整數
 * Divides block index by bucket group size (15) and takes integer
 *
 * @param idx - 區塊索引 / Block index
 * @returns 分流組索引 / Bucket index
 */
export function _calcBlockIndexToBucketIndexCore(idx: number)
{
	/** 使用 floor 取整數，確保正確的組別計算 / Use floor to get integer group index */
	return Math.floor(idx / BUCKET_CONFIG_GROUP_SIZE);
}

/**
 * 計算分流組索引 (Bucket Index)
 * Calculate group index
 *
 * 將區塊索引除以 BUCKET_CONFIG_GROUP_SIZE (15) 取整數
 * Divides block index by BUCKET_CONFIG_GROUP_SIZE (15) and takes integer
 *
 * @param blockIndex - 區塊索引 / Block index
 * @returns 組索引 / Bucket index
 */
export function _calcBlockIndexToBucketIndex(blockIndex: IGeoBlockIndex): IGeoBucketGridIndex
{
	return {
		bucketX: _calcBlockIndexToBucketIndexCore(blockIndex.xLngIdx),
		bucketY: _calcBlockIndexToBucketIndexCore(blockIndex.yLatIdx),
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
export function calculateCroodToBounds(crood: IGeoCoord)
{
	/** 取得區塊索引 / Get block index */
	const indices = _calcCoordToBlockIndex(crood);
	/** 取得座標範圍 / Get coordinate range */
	const range = _idxToRangeLngLatMinMax(indices);

	/** 轉換為邊界 / Convert to bounds */
	return rangeLngLatMinMaxToBounds(range);
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
export function _calcCenterByLngLatMin(minLngLat: IGpsLngLatMin)
{
	/** 從左下角向中心偏移 (加上半個區塊大小) / Offset from bottom-left to center (add half block size) */
	const half = _normalizeCoordScalarCore(BLOCK_SIZE / 2);

	return normalizeCoord({
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
export function calcCenterByAnyCoord(anyCoord: IGeoCoord)
{
	const minLngLat = calcGlobalBlockIndexAndCoord(anyCoord);

	return _calcCenterByLngLatMin(minLngLat);
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
export function getGridSpecsFromAnyPoint(anyCoord: IGeoCoord)
{
	const indices = _calcCoordToBlockIndex(anyCoord);
	const range = _idxToRangeLngLatMinMax(indices);

	const bounds = rangeLngLatMinMaxToBounds(range);

	const minLngLat = _boundsToLngLatMin(bounds);

	const center = _calcCenterByLngLatMin(minLngLat);

	return {
		blockPath: _formatBlockKey(minLngLat.minLng, minLngLat.minLat),
		bounds,
		center,
		indices,
	};
}

/**
 * 從任意座標推導其所屬 Bucket (L1) 的完整屬性
 * Derive complete bucket properties from any coordinate
 *
 * 取得區塊組（L1 層級）的完整屬性
 * Gets complete properties for the bucket group (L1 level)
 *
 * @param anyCoord - 任意座標 / Any coordinate
 * @returns 區塊組屬性 / Bucket properties
 */
export function getBucketSpecsFromAnyPoint(anyCoord: IGeoCoord)
{
	/**
	 * 計算區塊組資訊（包含 L1 的總跨度 0.3度）
	 * Calculate bucket info (L1 span = 0.3 degrees)
	 */
	const { bucketIndex, bucketCoord, blockIndex } = calcCoordToBucketIndexAndCoord(anyCoord);

	/**
	 * 根據區塊組大小計算座標範圍
	 * Calculate coordinate range based on bucket size
	 */
	const bucketRange = _minLngLatToRangeLngLatMinMax({
		minLng: bucketCoord.lng,
		minLat: bucketCoord.lat,
	}, BUCKET_CONFIG_GROUP_SIZE);

	/** 將座標範圍轉換為邊界 / Convert range to bounds */
	const bucketBounds = rangeLngLatMinMaxToBounds(bucketRange);

	return {
		bucketPath: _formatBlockKey(bucketCoord.lng, bucketCoord.lat, { sep: '/' }),
		bucketIndex,
		bucketBounds,
		blockIndex,
	};
}

export interface IResultRangeAndBlockIdsFromAnyCoordForMap
{
	/**
	 * 當前座標
	 */
	center: IGeoCoord;

	/**
	 * 用來匹配區塊範圍的偏移量(向外延伸)
	 */
	offset: number;
	/**
	 * 當前區塊
	 */
	block: IGeoBlockIndex & IGpsLngLatMin;
	/**
	 * 已匹配的區塊
	 */
	matchedBuckets: IMatchedBuckets;
	/**
	 * 已匹配的區塊範圍
	 */
	matchedRange: IGpsLngLatMinMax;
	/**
	 * 觸發範圍，用於觸發重新加載資料
	 * 範圍會小於 matchedRange
	 */
	triggerRange: IGpsLngLatMinMax;

	/**
	 * 觸發範圍的偏移量(向內收縮)
	 */
	triggerOffset: number;

	/**
	 *
	 */
	rangeForDetect: IGpsLngLatMinMax;
}

/**
 * @param anyCoord
 * @returns
 */
export function getRangeAndBlockIdsFromAnyCoordForMap(anyCoord: IGeoCoord): IResultRangeAndBlockIdsFromAnyCoordForMap
{
	anyCoord = normalizeCoord(anyCoord, GLOBAL_GRID_CONFIG_PRECISION_MAKRER);

	const block = calcGlobalBlockIndexAndCoord(anyCoord);

	const offsetHalf = _normalizeCoordScalarCore(BLOCK_SIZE * 0.5, GLOBAL_GRID_CONFIG_PRECISION);
	const offset = _normalizeCoordScalarCore(BLOCK_SIZE * 0.25, GLOBAL_GRID_CONFIG_PRECISION);

	const rangeForDetect = normalizeLngLatMinMax(expandRangeLngLatMinMax(_minLngLatToRangeLngLatMinMax({
		minLng: anyCoord.lng - offsetHalf,
		minLat: anyCoord.lat - offsetHalf,
	}), offset), GLOBAL_GRID_CONFIG_PRECISION);

	const result2 = calcBlockIdsInRange(rangeForDetect);

	const matchedRange: IGpsLngLatMinMax = {
		minLng: rangeForDetect.minLng,
		maxLng: rangeForDetect.maxLng,
		minLat: rangeForDetect.minLat,
		maxLat: rangeForDetect.maxLat,
	};

	const matchedBuckets = result2.matchedBlocks.reduce((acc, blockId) =>
	{

		const coord = decodeBlockKey(blockId);

		const indices = _calcCoordToBlockIndex(coord);

		const { bucketCoord } = calcCoordToBucketIndexAndCoord(coord);

		const bucketPath = _formatBlockKey(bucketCoord.lng, bucketCoord.lat, { sep: '/' });

		const result = _idxToRangeLngLatMinMax(indices);

		matchedRange.minLng = Math.min(matchedRange.minLng, result.minLng);
		matchedRange.minLat = Math.min(matchedRange.minLat, result.minLat);

		matchedRange.maxLng = Math.max(matchedRange.maxLng, result.maxLng);
		matchedRange.maxLat = Math.max(matchedRange.maxLat, result.maxLat);

		acc[bucketPath] ??= [];
		acc[bucketPath].push(blockId);

		return acc;
	}, {} as IMatchedBuckets);

	const triggerOffset = _normalizeCoordScalarCore(BLOCK_SIZE * 0.25, GLOBAL_GRID_CONFIG_PRECISION);

	const triggerRange: IGpsLngLatMinMax = normalizeLngLatMinMax(shrinkRangeLngLatMinMax(matchedRange, triggerOffset), GLOBAL_GRID_CONFIG_PRECISION);

	return {
		center: anyCoord,
		offset,
		block,
		...result2,
		matchedBuckets,
		matchedRange,
		triggerRange,
		triggerOffset,
		rangeForDetect,
	};
}
