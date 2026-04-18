/**
 * 網格計算工具
 * Grid computation utilities for geographic data processing.
 *
 * 提供共用的座標計算與區塊處理函式，可用於運行時（客戶端）與構建時（腳本）。
 */

import {
	IBlockCoordinate,
	IBounds,
	IGpsCenterBounds,
	IGpsCoordinate,
	IGpsLngLatMinMax,
	IGpsBlockIndex,
	IGpsRowColStartEnd,
} from "./grid-types";
import { BLOCK_SIZE, TAIWAN_BOUNDS } from "./grid-const";

/**
 * 將經緯度轉換為區塊 row 索引
 * Convert latitude to block row index
 *
 * @param lat - 緯度 / Latitude
 * @returns row 索引 / Row index
 */
export function latToRow(lat: number): number
{
	return Math.floor((lat - TAIWAN_BOUNDS.minLat) / BLOCK_SIZE);
}

/**
 * 將經度轉換為區塊 col 索引
 * Convert longitude to block col index
 *
 * @param lng - 經度 / Longitude
 * @returns col 索引 / Col index
 */
export function lngToCol(lng: number): number
{
	return Math.floor((lng - TAIWAN_BOUNDS.minLng) / BLOCK_SIZE);
}

/**
 * 由座標範圍計算區塊索引範圍
 * Calculate block index range from coordinate range
 *
 * 使用四個角落座標計算，確保正確處理邊界情況
 * Uses four corner coordinates calculation to ensure correct edge case handling
 *
 * @param minLat - 最小緯度 / Minimum latitude
 * @param maxLat - 最大緯度 / Maximum latitude
 * @param minLng - 最小經度 / Minimum longitude
 * @param maxLng - 最大經度 / Maximum longitude
 * @returns 區塊索引範圍 { startX, endX, startY, endY } / Block index range
 */
export function getBlockRange(
	minLat: number,
	maxLat: number,
	minLng: number,
	maxLng: number,
): IGpsRowColStartEnd
{
	/**
	 * 使用四個角落座標計算區塊索引（統一使用 Math.floor）
	 * Calculate block index using four corner coordinates (unified Math.floor)
	 */
	const topLeftRow = latToRow(minLat);
	const topLeftCol = lngToCol(minLng);
	const topRightRow = latToRow(minLat);
	const topRightCol = lngToCol(maxLng);
	const bottomLeftRow = latToRow(maxLat);
	const bottomLeftCol = lngToCol(minLng);
	const bottomRightRow = latToRow(maxLat);
	const bottomRightCol = lngToCol(maxLng);

	/** 取 row 的 min 和 max / Get min and max of row */
	const startRow = Math.min(topLeftRow, topRightRow, bottomLeftRow, bottomRightRow);
	const endRow = Math.max(topLeftRow, topRightRow, bottomLeftRow, bottomRightRow);

	/** 取 col 的 min 和 max / Get min and max of col */
	const startCol = Math.min(topLeftCol, topRightCol, bottomLeftCol, bottomRightCol);
	const endCol = Math.max(topLeftCol, topRightCol, bottomLeftCol, bottomRightCol);

	return { startX: startRow, endX: endRow, startY: startCol, endY: endCol };
}

/**
 * 由中心點計算區塊索引範圍（標準網格大小）
 * Calculate block index range from center point (standard grid size)
 *
 * @param lat - 中心點緯度 / Center point latitude
 * @param lng - 中心點經度 / Center point longitude
 * @returns 區塊索引範圍 / Block index range
 */
export function getBlockRangeFromCenter(
	lat: number,
	lng: number,
): IGpsRowColStartEnd
{
	const { yIdx, xIdx } = getBlockIndex(lat, lng);
	return {
		startX: yIdx,
		endX: yIdx,
		startY: xIdx,
		endY: xIdx,
	};
}

/**
 * 由中心點計算座標範圍（標準網格大小）
 * Calculate coordinate range from center point (standard grid size)
 *
 * 以中心點為基準，向外擴展半個網格大小
 * Extends half grid size outward from center point
 *
 * @param lat - 中心點緯度 / Center point latitude
 * @param lng - 中心點經度 / Center point longitude
 * @returns 座標範圍 / Coordinate range
 */
export function getCoordRangeFromCenter(
	lat: number,
	lng: number,
): IGpsLngLatMinMax
{
	const halfSize = BLOCK_SIZE / 2;
	return {
		minLat: lat - halfSize,
		maxLat: lat + halfSize,
		minLng: lng - halfSize,
		maxLng: lng + halfSize,
	};
}

/**
 * 計算區塊範圍內有多少區塊
 * Calculate how many blocks are in a block range
 *
 * @param startRow - 起始 row / Start row
 * @param endRow - 結束 row / End row
 * @param startCol - 起始 col / Start col
 * @param endCol - 結束 col / End col
 * @returns 區塊數量 / Block count
 */
export function getBlockCountInRange(
	startRow: number,
	endRow: number,
	startCol: number,
	endCol: number,
): number
{
	return (endRow - startRow + 1) * (endCol - startCol + 1);
}

/**
 * 驗證區塊範圍是否為標準網格大小（1, 2, 或 4 個區塊）
 * Validate block range is standard grid size (1, 2, or 4 blocks)
 *
 * 標準網格大小用於查詢優化
 * Standard grid size is used for query optimization
 *
 * @param startRow - 起始 row / Start row
 * @param endRow - 結束 row / End row
 * @param startCol - 起始 col / Start col
 * @param endCol - 結束 col / End col
 * @returns 是否為標準網格大小 / Whether is standard grid size
 */
export function isValidBlockRange(
	startRow: number,
	endRow: number,
	startCol: number,
	endCol: number,
): boolean
{
	const count = getBlockCountInRange(startRow, endRow, startCol, endCol);
	return [1, 2, 4].includes(count);
}

/**
 * 計算某個經緯度所屬的區塊索引
 * Calculate the block index for a given coordinate.
 *
 * @param lat - 緯度 / Latitude
 * @param lng - 經度 / Longitude
 * @returns 區塊索引 { yIdx, xIdx } / Block index
 */
export function getBlockIndex(lat: number, lng: number): IGpsBlockIndex
{
	const row = latToRow(lat);
	const col = lngToCol(lng);
	return { yIdx: row, xIdx: col } as IGpsBlockIndex;
}

/**
 * 計算區塊的中心點座標
 * Calculate the center coordinate of a block.
 *
 * @param row - 區塊列索引 / Block row index
 * @param col - 區塊行索引 / Block col index
 * @returns 中心點座標 { lat, lng } / Center coordinates
 */
export function getBlockCenter(row: number, col: number): IGpsCoordinate
{
	const lat = TAIWAN_BOUNDS.minLat + (row + 0.5) * BLOCK_SIZE;
	const lng = TAIWAN_BOUNDS.minLng + (col + 0.5) * BLOCK_SIZE;
	return { lat, lng };
}

/**
 * 計算區塊的四角座標點
 * Calculate the four corner coordinates of a block.
 *
 * @param row - 區塊列索引 / Block row index
 * @param col - 區塊行索引 / Block col index
 * @returns 四角座標點 / Four corner coordinates
 */
export function getBlockBounds(row: number, col: number): IBounds
{
	const north = TAIWAN_BOUNDS.minLat + (row + 1) * BLOCK_SIZE;
	const south = TAIWAN_BOUNDS.minLat + row * BLOCK_SIZE;
	const east = TAIWAN_BOUNDS.minLng + (col + 1) * BLOCK_SIZE;
	const west = TAIWAN_BOUNDS.minLng + col * BLOCK_SIZE;

	return {
		northWest: { lat: north, lng: west },
		northEast: { lat: north, lng: east },
		southWest: { lat: south, lng: west },
		southEast: { lat: south, lng: east },
	};
}

/**
 * 由任意座標反推回去的任意區塊範圍
 * Block range derived from any coordinate
 *
 * @param lat - 緯度 / Latitude
 * @param lng - 經度 / Longitude
 * @returns 區塊範圍包含中心點與邊界 / Block range containing center and bounds
 */
export function getBlockFromCoordinate(lat: number, lng: number): IGpsCenterBounds
{
	const { yIdx, xIdx } = getBlockIndex(lat, lng);
	const center = getBlockCenter(yIdx, xIdx);
	const bounds = getBlockBounds(yIdx, xIdx);
	return { center, bounds };
}

/**
 * 計算指定範圍內包含多少標準區塊
 * Calculate intersecting blocks within a given range
 *
 * 支援三種調用方式：
 * - 個別參數: calculateIntersectingBlocks(minLat, maxLat, minLng, maxLng)
 * - 範圍物件: calculateIntersectingBlocks({ minLat, maxLat, minLng, maxLng })
 * - 單一坐標: calculateIntersectingBlocks({ lat, lng }) → 查詢該點周圍的區塊
 *
 * Supports three calling modes:
 * - Individual parameters: calculateIntersectingBlocks(minLat, maxLat, minLng, maxLng)
 * - Range object: calculateIntersectingBlocks({ minLat, maxLat, minLng, maxLng })
 * - Single coordinate: calculateIntersectingBlocks({ lat, lng }) → Query blocks around the point
 *
 * @param minLatOrRangeOrCoord - 最小緯度或座標範圍物件或單一坐標 / Minimum latitude or coordinate range object or single coordinate
 * @param maxLat - 最大緯度（當為個別參數時）/ Maximum latitude (when using individual parameters)
 * @param minLng - 最小經度（當為個別參數時）/ Minimum longitude (when using individual parameters)
 * @param maxLng - 最大經度（當為個別參數時）/ Maximum longitude (when using individual parameters)
 * @returns 區塊範圍與交集的區塊資料 / Block range and intersecting block data
 */
export function calculateIntersectingBlocks(
	minLatOrRangeOrCoord: number | IGpsLngLatMinMax | IGpsCoordinate,
	maxLat?: number,
	minLng?: number,
	maxLng?: number,
): {
	center: IGpsCoordinate;
	bounds: IBounds;
	match: Record<string, IBlockCoordinate>;
}
{
	/**
	 * 解析參數
	 * Parse parameters
	 */
	let minLat: number;
	let maxLatVal: number;
	let minLngVal: number;
	let maxLngVal: number;

	if (typeof minLatOrRangeOrCoord === "object")
	{
		/**
		 * 檢查是否為單一坐標 (只有 lat, lng) 或範圍 (有 minLat, maxLat 等)
		 * Check if it's a single coordinate (only lat, lng) or range (has minLat, maxLat, etc.)
		 */
		if ("minLat" in minLatOrRangeOrCoord)
		{
			/** 範圍物件調用 / Range object call */
			({ minLat, maxLat: maxLatVal, minLng: minLngVal, maxLng: maxLngVal } = minLatOrRangeOrCoord as IGpsLngLatMinMax);
		}
		else
		{
			/**
			 * 單一坐標：查詢該點周圍的區塊
			 * Single coordinate: query blocks around the point
			 */
			const coord = minLatOrRangeOrCoord as IGpsCoordinate;
			/** 以該點為中心，向外擴展半個區塊 / Extend half block from the point as center */
			const halfSize = BLOCK_SIZE / 2;
			minLat = coord.lat - halfSize;
			maxLatVal = coord.lat + halfSize;
			minLngVal = coord.lng - halfSize;
			maxLngVal = coord.lng + halfSize;
		}
	}
	else
	{
		/** 個別參數調用 / Individual parameters call */
		minLat = minLatOrRangeOrCoord;
		maxLatVal = maxLat!;
		minLngVal = minLng!;
		maxLngVal = maxLng!;
	}

	/**
	 * 計算查詢範圍的四個角落所屬的區塊索引
	 * Calculate block index of four corners of query range
	 */
	const { startX, endX, startY, endY } = getBlockRange(minLat, maxLatVal, minLngVal, maxLngVal);

	/**
	 * 驗證區塊數量不超過 4 個
	 * Validate block count not exceeding 4
	 */
	if (!isValidBlockRange(startX, endX, startY, endY))
	{
		const count = getBlockCountInRange(startX, endX, startY, endY);
		console.warn(`警告: 查詢範圍包含 ${count} 個區塊（預期最多 4 個）`);
	}

	/**
	 * 收集所有交集的區塊
	 * Collect all intersecting blocks
	 */
	const match: Record<string, IBlockCoordinate> = {};

	for (let row = startX; row <= endX; row++)
	{
		for (let col = startY; col <= endY; col++)
		{
			const key = `${col}_${row}`;
			const center = getBlockCenter(row, col);
			const bounds = getBlockBounds(row, col);

			/**
			 * 用於查詢 grid-index.json 的 key (lng_lat)
			 * Key for querying grid-index.json (lng_lat format)
			 */
			const lngLat = `${center.lng.toFixed(4)}_${center.lat.toFixed(4)}`;

			match[key] = {
				yIdx: row,
				xIdx: col,
				center,
				bounds,
				lngLat,
			};
		}
	}

	/**
	 * 計算查詢範圍的中心點
	 * Calculate center of query range
	 */
	const centerLat = (minLat + maxLatVal) / 2;
	const centerLng = (minLngVal + maxLngVal) / 2;
	const center = { lat: centerLat, lng: centerLng };

	/**
	 * 計算查詢範圍的邊界
	 * Calculate bounds of query range
	 */
	const bounds = getBlockBounds(startX, startY);

	return { center, bounds, match };
}

/**
 * 由中心點查詢區塊（標準網格大小，查詢結果必為 1, 2, 或 4 個區塊）
 * Query blocks from center point (standard grid size, result always 1, 2, or 4 blocks)
 *
 * 支援兩種調用方式：
 * - 個別參數: queryBlocksFromCenter(lat, lng)
 * - 物件參數: queryBlocksFromCenter({ lat, lng })
 *
 * Supports two calling modes:
 * - Individual parameters: queryBlocksFromCenter(lat, lng)
 * - Object parameters: queryBlocksFromCenter({ lat, lng })
 *
 * 以中心點所在區塊為基準，根據與區塊中心點的相對位置，計算周圍區塊
 * Based on the center point's block, calculates surrounding blocks based on relative position to block center
 *
 * @param latOrCoord - 中心點緯度或坐標物件 / Center point latitude or coordinate object
 * @param lng - 中心點經度（當為個別參數時）/ Center point longitude (when using individual parameters)
 * @returns 區塊範圍與交集的區塊資料 / Block range and intersecting block data
 */
export function queryBlocksFromCenter(
	latOrCoord: number | IGpsCoordinate,
	lng?: number,
): {
	/** 查詢範圍的中心點 / Center of query range */
	center: IGpsCoordinate;
	/** 查詢範圍的邊界 / Bounds of query range */
	bounds: IBounds;
	/** 交集區塊 / Intersecting blocks (1, 2, or 4) */
	match: Record<string, IBlockCoordinate>;
}
{
	// 解析參數
	let lat: number;
	let lngVal: number;

	if (typeof latOrCoord === "object")
	{
		// 物件參數調用
		lat = latOrCoord.lat;
		lngVal = latOrCoord.lng;
	}
	else
	{
		// 個別參數調用
		lat = latOrCoord;
		lngVal = lng!;
	}

// 取得中心點所屬的區塊索引
	const { yIdx, xIdx } = getBlockIndex(lat, lngVal);

	// 取得該區塊的中心點座標
	const blockCenter = getBlockCenter(yIdx, xIdx);

	// 計算 normalized offset (-1 到 1)
	// offset > 0: 在右/上側
	// offset < 0: 在左/下側
	const halfSize = BLOCK_SIZE / 2;
	const latOffset = (lat - blockCenter.lat) / halfSize;
	const lngOffset = (lngVal - blockCenter.lng) / halfSize;

	// 根據 offset 計算 row/col 範圍
	// 邊界閾值設為 0.5（50% 的半格）
	const rowThreshold = 0.5;
	const colThreshold = 0.5;

	// 決定 row 範圍
	let rowStart = yIdx;
	let rowEnd = yIdx;
	if (latOffset > rowThreshold)
	{
		rowEnd = yIdx + 1;
	}
	else if (latOffset < -rowThreshold) rowStart = yIdx - 1;

	// 決定 col 範圍
	let colStart = xIdx;
	let colEnd = xIdx;
	if (lngOffset > colThreshold)
	{
		colEnd = xIdx + 1;
	}
	else if (lngOffset < -colThreshold) colStart = xIdx - 1;

	// 收集所有交集的區塊
	const match: Record<string, IBlockCoordinate> = {};

	for (let r = rowStart; r <= rowEnd; r++)
	{
		for (let c = colStart; c <= colEnd; c++)
		{
			const key = `${c}_${r}`;
			const center = getBlockCenter(r, c);
			const bounds = getBlockBounds(r, c);
			const lngLat = `${center.lng.toFixed(4)}_${center.lat.toFixed(4)}`;

			match[key] = {
				yIdx: r,
				xIdx: c,
				center,
				bounds,
				lngLat,
			};
		}
	}

	// 計算查詢範圍的中心點（使用原始輸入）
	const resultCenter = { lat, lng: lngVal };

	// 計算查詢範圍的邊界（使用區塊邊界）
	const currentBounds = getBlockBounds(yIdx, xIdx);

	return { center: resultCenter, bounds: currentBounds, match };
}
