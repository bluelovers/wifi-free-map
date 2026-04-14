/**
 * 地址解析工具
 * Address parsing utilities for geographic data processing.
 *
 * 提供共用的地址解析函式，可用於運行時（客戶端）與構建時（腳本）。
 */
import { ILocationInfo } from '@/lib/utils/grid/grid-types';

/**
 * 清理路名中的縣市區前輟
 * Clean road name by removing city/district prefix
 *
 * @param road - 路名
 * @returns 清理後的路名
 */
export function cleanRoad(road: string): string
{
	return road.replace(/^[^\d\s]+(?:市|縣)/, "").replace(/^[^\d\s]+(?:區|市|鎮|鄉)/, "");
}

/**
 * 解析區塊檔名取得座標
 * Parse block file name to get coordinates
 *
 * @param fileName - 區塊檔名（格式：經度_緯度.json）
 * @returns 座標或 null（若格式無效）
 */
export function parseBlockFileName(fileName: string): { lng: number; lat: number } | null
{
	const match = fileName.match(/^(-?\d+\.\d+)_(-?\d+\.\d+)\.json$/);
	if (!match) return null;
	return {
		lng: parseFloat(match[1]),
		lat: parseFloat(match[2]),
	};
}

/**
 * 從地址中提取各部分
 * Extract parts from address.
 *
 * @param address - 地址文字
 * @returns 提取的區域資訊
 */
export function extractLocationInfo(
	address: string,
): ILocationInfo
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

/**
 * 從位置資訊建立基本位置字串
 * Build base location string from location info
 *
 * @param location - 位置資訊
 * @returns 基本位置字串（郵遞區號+縣市+區）
 */
export function buildBaseLocation(location: ILocationInfo): string
{
	const { zipCode, city, district } = location;
	return [zipCode, city, district].filter(Boolean).join("");
}

/**
 * 從位置資訊建立完整位置字串
 * Build full location string from location info
 *
 * @param location - 位置資訊
 * @returns 完整位置字串（含路名）
 */
export function buildFullLocation(location: ILocationInfo): string
{
	const base = buildBaseLocation(location);
	const { road } = location;
	if (!road) return base;

	const cleanedRoad = cleanRoad(road);
	const fullLocation = [base, cleanedRoad].filter(Boolean).join("");
	return fullLocation;
}
