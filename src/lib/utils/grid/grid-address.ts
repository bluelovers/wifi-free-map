/**
 * 地址解析工具
 * Address parsing utilities for geographic data processing.
 *
 * 提供共用的地址解析函式，可用於運行時（客戶端）與構建時（腳本）。
 * Provides shared address parsing functions, usable at runtime (client) and build time (scripts).
 */
import { ILocationInfo } from '@/lib/utils/grid/grid-types';

/**
 * 清理路名中的縣市區前輟
 * Clean road name by removing city/district prefix
 *
 * 移除路名開頭的縣市區前輟，使路名更精簡
 * Removes city/district prefixes from the beginning of road names for cleaner results
 *
 * @param road - 路名 / Road name
 * @returns 清理後的路名 / Cleaned road name
 */
export function cleanRoad(road: string): string
{
	/**
	 * 移除縣市前輟（如 "台北市"、"新北縣"）
	 * Remove city prefix (e.g., "台北市", "新北縣")
	 */
	return road.replace(/^[^\d\s]+(?:市|縣)/, "").replace(/^[^\d\s]+(?:區|市|鎮|鄉)/, "");
}

/**
 * 解析區塊檔名取得座標
 * Parse block file name to get coordinates
 *
 * 從區塊檔名（格式：經度_緯度.json）解析出座標
 * Parses coordinates from block file name (format: longitude_latitude.json)
 *
 * @param fileName - 區塊檔名 / Block file name
 * @returns 座標或 null（若格式無效）/ Coordinates or null (if format invalid)
 */
export function parseBlockFileName(fileName: string): { lng: number; lat: number } | null
{
	const match = fileName.match(/^(-?\d+\.\d+)_(-?\d+\.\d+)\.json$/);
	if (!match) return null;

	/** 解析經度和緯度 / Parse longitude and latitude */
	return {
		lng: parseFloat(match[1]),
		lat: parseFloat(match[2]),
	};
}

/**
 * 從地址中提取各部分
 * Extract parts from address.
 *
 * 從完整地址中解析出郵遞區號、縣市、行政區、路名
 * Parses zip code, city, district, road from complete address
 *
 * @param address - 地址文字 / Address text
 * @returns 提取的區域資訊 / Extracted location information
 */
export function extractLocationInfo(
	address: string,
): ILocationInfo
{
	/** 空地址回傳空物件 / Return empty object for empty address */
	if (!address) return { zipCode: "", city: "", district: "", road: "" };

	/**
	 * 清理地址（移除換行符號）
	 * Clean address (remove line breaks)
	 */
	const cleanAddress = address.replace(/\n/g, " ").trim();

	/**
	 * 提取郵遞區號（3碼或 5 碼數字）
	 * Extract zip code (3 or 5 digit number)
	 */
	const zipMatch = cleanAddress.match(/^(\d{3,5})/);
	const zipCode = zipMatch ? zipMatch[1] : "";

	/**
	 * 嘗試匹配縣市（XX 市或 XX 縣）
	 * Try to match city (XX市 or XX縣)
	 */
	const cityMatch = cleanAddress.match(/([^\d\s]+(?:市|縣))/);
	const city = cityMatch ? cityMatch[1] : "";

	/**
	 * 嘗試匹配行政區（XX 區或 XX 市）
	 * Try to match district (XX區 or XX市)
	 */
	let remaining = cleanAddress;
	if (city) remaining = cleanAddress.replace(city, "");
	const districtMatch = remaining.match(/([^\d\s]+(?:區|市|鎮|鄉))/);
	const district = districtMatch ? districtMatch[1] : "";

	/**
	 * 嘗試匹配路名（不包含門牌號碼）
	 * Try to match road name (without house number)
	 */
	const roadMatch = cleanAddress.match(/[^\d\s]+(?:路|街|大道)[一二三四五六七八九十]*(?:段)?/);
	const road = roadMatch ? roadMatch[0] : "";

	return { zipCode, city, district, road };
}

/**
 * 從位置資訊建立基本位置字串
 * Build base location string from location info
 *
 * 組合郵遞區號、縣市、行政區為基本位置字串
 * Combines zip code, city, district into base location string
 *
 * @param location - 位置資訊 / Location information
 * @returns 基本位置字串（郵遞區號+縣市+區）/ Base location string (zipCode+city+district)
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
 * 組合基本位置字串與路名為完整位置字串
 * Combines base location string with road name into full location string
 *
 * @param location - 位置資訊 / Location information
 * @returns 完整位置字串（含路名）/ Full location string (with road name)
 */
export function buildFullLocation(location: ILocationInfo): string
{
	/** 取得基本位置字串 / Get base location string */
	const base = buildBaseLocation(location);
	const { road } = location;

	/** 如果沒有路名，回傳基本位置 / If no road name, return base */
	if (!road) return base;

	/** 清理路名後組合 / Clean road and combine */
	const cleanedRoad = cleanRoad(road);
	const fullLocation = [base, cleanedRoad].filter(Boolean).join("");
	return fullLocation;
}
