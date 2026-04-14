/**
 * 地圖區塊計算工具
 * Grid calculation utilities for splitting geographic data into map blocks.
 *
 * 提供共用的座標計算與地址解析函式，供 split-grid-wifi.ts
 * 與 split-grid-charging.ts 等腳本使用。
 */

import {
	IBlockCoordinate,
	IBounds,
	IGpsCenterBounds,
	IGpsCoordinate,
	IGpsLatLngMaxMin,
	IGpsRowCol,
	IGpsRowColStartEnd,
} from '@/lib/utils/grid/grid-types';
import { BLOCK_SIZE, TAIWAN_BOUNDS } from '@/lib/utils/grid/grid-const';

/**
 * 將經緯度轉換為區塊 row 索引
 * Convert latitude to block row index
 *
 * @param lat - 緯度
 * @returns row 索引
 */
export function latToRow(lat: number): number
{
	return Math.floor((lat - TAIWAN_BOUNDS.minLat) / BLOCK_SIZE);
}

/**
 * 將經度轉換為區塊 col 索引
 * Convert longitude to block col index
 *
 * @param lng - 經度
 * @returns col 索引
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
 * 注意：此函式不限制範圍大小，請確保傳入的座標範圍 <= 網格大小
 * @param minLat - 最小緯度
 * @param maxLat - 最大緯度
 * @param minLng - 最小經度
 * @param maxLng - 最大經度
 * @returns 區塊索引範圍 { startRow, endRow, startCol, endCol }
 */
export function getBlockRange(
	minLat: number,
	maxLat: number,
	minLng: number,
	maxLng: number,
): IGpsRowColStartEnd
{
	// 使用四個角落座標計算區塊索引（統一使用 Math.floor）
	const topLeftRow = latToRow(minLat);
	const topLeftCol = lngToCol(minLng);
	const topRightRow = latToRow(minLat);
	const topRightCol = lngToCol(maxLng);
	const bottomLeftRow = latToRow(maxLat);
	const bottomLeftCol = lngToCol(minLng);
	const bottomRightRow = latToRow(maxLat);
	const bottomRightCol = lngToCol(maxLng);

	// 取 row 的 min 和 max
	const startRow = Math.min(topLeftRow, topRightRow, bottomLeftRow, bottomRightRow);
	const endRow = Math.max(topLeftRow, topRightRow, bottomLeftRow, bottomRightRow);

	// 取 col 的 min 和 max
	const startCol = Math.min(topLeftCol, topRightCol, bottomLeftCol, bottomRightCol);
	const endCol = Math.max(topLeftCol, topRightCol, bottomLeftCol, bottomRightCol);

	return { startRow, endRow, startCol, endCol };
}

/**
 * 由中心點計算區塊索引範圍（標準網格大小）
 * Calculate block index range from center point (standard grid size)
 *
 * @param lat - 中心點緯度
 * @param lng - 中心點經度
 * @returns 區塊索引範圍 { startRow, endRow, startCol, endCol }
 */
export function getBlockRangeFromCenter(
	lat: number,
	lng: number,
): IGpsRowColStartEnd
{
	const { row, col } = getBlockIndex(lat, lng);
	return {
		startRow: row,
		endRow: row,
		startCol: col,
		endCol: col,
	};
}

/**
 * 由中心點計算座標範圍（標準網格大小）
 * Calculate coordinate range from center point (standard grid size)
 *
 * 以中心點為基準，向外擴展半個網格大小
 * @param lat - 中心點緯度
 * @param lng - 中心點經度
 * @returns 座標範圍 { minLat, maxLat, minLng, maxLng }
 */
export function getCoordRangeFromCenter(
	lat: number,
	lng: number,
): IGpsLatLngMaxMin
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
 * @param startRow - 起始 row
 * @param endRow - 結束 row
 * @param startCol - 起始 col
 * @param endCol - 結束 col
 * @returns 區塊數量
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
 * @param startRow - 起始 row
 * @param endRow - 結束 row
 * @param startCol - 起始 col
 * @param endCol - 結束 col
 * @returns 是否為標準網格大小
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
 * @param lat - 緯度
 * @param lng - 經度
 * @returns 區塊索引 { row, col }
 */
export function getBlockIndex(lat: number, lng: number): { row: number; col: number }
{
	const row = latToRow(lat);
	const col = lngToCol(lng);
	return { row, col } as IGpsRowCol;
}

/**
 * 計算區塊的中心點座標
 * Calculate the center coordinate of a block.
 *
 * @param row - 區塊列索引
 * @param col - 區塊行索引
 * @returns 中心點座標 { lat, lng }
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
 * @param row - 區塊列索引
 * @param col - 區塊行索引
 * @returns 四角座標點 { northWest, northEast, southWest, southEast }
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
 * Block range derived from any coordinate (reverse of getBlockCenter)
 *
 * @param lat - 緯度
 * @param lng - 經度
 * @returns 區塊範圍包含中心點與邊界
 */
export function getBlockFromCoordinate(lat: number, lng: number): IGpsCenterBounds
{
	const { row, col } = getBlockIndex(lat, lng);
	const center = getBlockCenter(row, col);
	const bounds = getBlockBounds(row, col);
	return { center, bounds };
}

/**
 * 計算指定範圍內包含多少標準區塊
 * Calculate how many standard blocks are intersected within a given range
 *
 * @param minLat - 最小緯度
 * @param maxLat - 最大緯度
 * @param minLng - 最小經度
 * @param maxLng - 最大經度
 * @returns 區塊範圍與交集的區塊資料
 */
export function calculateIntersectingBlocks(
	minLat: number,
	maxLat: number,
	minLng: number,
	maxLng: number,
): {
	/** 查詢範圍的中心點 / Center of query range */
	center: IGpsCoordinate;
	/** 查詢範圍的邊界 / Bounds of query range */
	bounds: IBounds;
	/** 交集區塊 / Intersecting blocks */
	match: Record<string, IBlockCoordinate>;
}
{
	// 計算查詢範圍的四個角落所屬的區塊索引
	const { startRow, endRow, startCol, endCol } = getBlockRange(minLat, maxLat, minLng, maxLng);

	// 驗證區塊數量不超過 4 個
	if (!isValidBlockRange(startRow, endRow, startCol, endCol))
	{
		const count = getBlockCountInRange(startRow, endRow, startCol, endCol);
		console.warn(`警告: 查詢範圍包含 ${count} 個區塊（預期最多 4 個）`);
	}

	// 收集所有交集的區塊
	const match: Record<string, IBlockCoordinate> = {};

	for (let row = startRow; row <= endRow; row++)
	{
		for (let col = startCol; col <= endCol; col++)
		{
			const key = `${col}_${row}`;
			const center = getBlockCenter(row, col);
			const bounds = getBlockBounds(row, col);

			/** 用於查詢 grid-index.json 的 key (lng_lat) */
			const lngLat = `${center.lng.toFixed(4)}_${center.lat.toFixed(4)}`;

			match[key] = {
				row,
				col,
				center,
				bounds,
				lngLat,
			};
		}
	}

	// 計算查詢範圍的中心點
	const center = {
		lat: (minLat + maxLat) / 2,
		lng: (minLng + maxLng) / 2,
	};

	// 查詢範圍的邊界
	const bounds = {
		northWest: { lat: maxLat, lng: minLng },
		northEast: { lat: maxLat, lng: maxLng },
		southWest: { lat: minLat, lng: minLng },
		southEast: { lat: minLat, lng: maxLng },
	};

	return { center, bounds, match };
}

/**
 * 由中心點查詢區塊（標準網格大小，查詢結果必為 1, 2, 或 4 個區塊）
 * Query blocks from center point (standard grid size, result always 1, 2, or 4 blocks)
 *
 * 以中心點所在區塊為基準，根據與區塊中心點的相對位置，計算周圍區塊
 * - 偏移量在 ±25% 以內：1 區塊
 * - 偏移量在 ±25% ~ ±50%：2 區塊
 * - 偏移量超過 ±50%：4 區塊
 *
 * @param lat - 中心點緯度
 * @param lng - 中心點經度
 * @returns 區塊範圍與交集的區塊資料
 */
export function queryBlocksFromCenter(
	lat: number,
	lng: number,
): {
	/** 查詢範圍的中心點 / Center of query range */
	center: IGpsCoordinate;
	/** 查詢範圍的邊界 / Bounds of query range */
	bounds: IBounds;
	/** 交集區塊 / Intersecting blocks (1, 2, or 4) */
	match: Record<string, IBlockCoordinate>;
}
{
	// 取得中心點所屬的區塊索引
	const { row, col } = getBlockIndex(lat, lng);

	// 取得該區塊的中心點座標
	const blockCenter = getBlockCenter(row, col);

	// 計算 normalized offset (-1 到 1)
	// offset > 0: 在右/上側
	// offset < 0: 在左/下側
	const halfSize = BLOCK_SIZE / 2;
	const latOffset = (lat - blockCenter.lat) / halfSize;
	const lngOffset = (lng - blockCenter.lng) / halfSize;

	// 根據 offset 計算 row/col 範圍
	// 邊界閾值設為 0.5（50% 的半格）
	const rowThreshold = 0.5;
	const colThreshold = 0.5;

	// 決定 row 範圍
	let rowStart = row;
	let rowEnd = row;
	if (latOffset > rowThreshold)
	{
		rowEnd = row + 1;
	}
	else if (latOffset < -rowThreshold) rowStart = row - 1;

	// 決定 col 範圍
	let colStart = col;
	let colEnd = col;
	if (lngOffset > colThreshold)
	{
		colEnd = col + 1;
	}
	else if (lngOffset < -colThreshold) colStart = col - 1;

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
				row: r,
				col: c,
				center,
				bounds,
				lngLat,
			};
		}
	}

	// 計算查詢範圍的中心點（使用原始輸入）
	const center = { lat, lng };

	// 計算查詢範圍的邊界（使用區塊邊界）
	const currentBounds = getBlockBounds(row, col);

	return { center, bounds: currentBounds, match };
}

/**
 * 從地址中提取各部分
 * Extract parts from address.
 *
 * @param address - 地址文字
 * @returns 提取的區域資訊 { zipCode, city, district, road }
 */
export function extractLocationInfo(
	address: string,
): { zipCode: string; city: string; district: string; road: string }
{
	if (!address) return { zipCode: "", city: "", district: "", road: "" };

	// 清理地址（移除換行符號）
	const cleanAddress = address.replace(/\n/g, " ").trim();

	// 提取郵遞區號（3碼或5碼數字）
	const zipMatch = cleanAddress.match(/^(\d{3,5})/);
	const zipCode = zipMatch ? zipMatch[1] : "";

	// 嘗試匹配縣市（XX市 或 XX縣）
	const cityMatch = cleanAddress.match(/([^\d\s]+(?:市|縣))/);
	const city = cityMatch ? cityMatch[1] : "";

	// 嘗試匹配行政區（XX區 或 XX市）
	let remaining = cleanAddress;
	if (city) remaining = cleanAddress.replace(city, "");
	const districtMatch = remaining.match(/([^\d\s]+(?:區|市|鎮|鄉))/);
	const district = districtMatch ? districtMatch[1] : "";

	// 嘗試匹配路名（不包含門牌號碼）
	const roadMatch = cleanAddress.match(/[^\d\s]+(?:路|街|大道)[一二三四五六七八九十]*(?:段)?/);
	const road = roadMatch ? roadMatch[0] : "";

	return { zipCode, city, district, road };
}
