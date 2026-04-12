/**
 * 資料轉換工具函式庫
 * Data transformation utilities.
 *
 * 提供將原始資料（JSON）轉換為結構化資料的函式。
 * Provides functions to transform raw data (JSON) to structured data.
 */

import { readFile } from "fs/promises";
import { resolve } from "path";
import type { Hotspot, RawHotspot } from "../types/hotspot";
import type { ChargingStation, RawChargingStation } from "../types/charging";
import { mapRawToHotspot } from "../types/hotspot";
// import { mapRawToCharging } from "../types/charging"; // removed: using convertChargingRaw directly

// ==================== Wi-Fi 熱點轉換 ====================

/**
 * 將原始 Wi-Fi 熱點資料轉換為標準格式
 * Convert raw Wi-Fi hotspot data to standard format.
 *
 * 注意：Wi-Fi 原始資料使用英文鍵 (Name, Latitude, Longitude, Address)
 * Note: Wi-Fi raw data uses English keys (Name, Latitude, Longitude, Address)
 *
 * @param raw - 原始資料物件
 * @returns 轉換後的 Hotspot 物件
 */
export function convertWiFiRaw(raw: RawHotspot): Hotspot
{
	return {
		name: raw.Name ?? "",
		lat: Number(raw.Latitude) || 0,
		lng: Number(raw.Longitude) || 0,
		address: raw.Address ?? "",
	};
}

/**
 * 將原始 Wi-Fi 熱點資料陣列轉換為 Hotspot 陣列
 * Convert array of raw Wi-Fi hotspot data to Hotspot array.
 *
 * @param rawData - 原始資料陣列
 * @returns 轉換後的 Hotspot 陣列
 */
export function convertWiFiArray(rawData: RawHotspot[]): Hotspot[]
{
	return rawData.map(convertWiFiRaw).filter((item) => item.name && (item.lat !== 0 || item.lng !== 0));
}

// ==================== 充電站轉換 ====================

/**
 * 將原始充電站資料轉換為標準格式
 * Convert raw charging station data to standard format.
 *
 * 注意：充電站原始資料使用中文鍵 (充電站名稱, 緯度, 經度, 地址)
 * Note: Charging raw data uses Chinese keys (充電站名稱, 緯度, 經度, 地址)
 *
 * @param raw - 原始資料物件
 * @returns 轉換後的 ChargingStation 物件
 */
export function convertChargingRaw(raw: RawChargingStation): ChargingStation
{
	return {
		name: raw["充電站名稱"] ?? "",
		lat: Number(raw["緯度"]) || 0,
		lng: Number(raw["經度"]) || 0,
		address: raw["地址"] ?? "",
	};
}

/**
 * 將原始充電站資料陣列轉換為 ChargingStation 陣列
 * Convert array of raw charging station data to ChargingStation array.
 *
 * @param rawData - 原始資料陣列
 * @returns 轉換後的 ChargingStation 陣列
 */
export function convertChargingArray(rawData: RawChargingStation[]): ChargingStation[]
{
	return rawData.map(convertChargingRaw).filter(
		(item) => item.name && (item.lat !== 0 || item.lng !== 0),
	);
}

// ==================== 檔案 I/O 函式 ====================

/**
 * 從檔案讀取並轉換 Wi-Fi 熱點資料
 * Read and convert Wi-Fi hotspot data from file.
 *
 * @param filePath - JSON 檔案路徑
 * @returns 轉換後的 Hotspot 陣列
 */
export async function readAndConvertWiFi(filePath: string): Promise<Hotspot[]>
{
	const rawContent = await readFile(filePath, "utf-8");
	const rawData: RawHotspot[] = JSON.parse(rawContent);
	return convertWiFiArray(rawData);
}

/**
 * 從檔案讀取並轉換充電站資料
 * Read and convert charging station data from file.
 *
 * @param filePath - JSON 檔案路徑
 * @returns 轉換後的 ChargingStation 陣列
 */
export async function readAndConvertCharging(filePath: string): Promise<ChargingStation[]>
{
	const rawContent = await readFile(filePath, "utf-8");
	const rawData: RawChargingStation[] = JSON.parse(rawContent);
	return convertChargingArray(rawData);
}

/**
 * 專案根目錄
 * Project root directory.
 *
 * 使用 process.cwd() 取得專案根目錄，確保在 ES modules 中正常運作。
 * Uses process.cwd() to get project root, works in ES modules.
 */
const PROJECT_ROOT = process.cwd();

/**
 * 預設的輸出目錄
 * Default output directory.
 */
export const DEFAULT_OUTPUT_DIR = resolve(PROJECT_ROOT, "public/data");

/**
 * 預設的輸入目錄（相對於專案根目錄）
 * Default input directory (relative to project root).
 */
export const DEFAULT_INPUT_DIR = resolve(PROJECT_ROOT, "public/data");

/**
 * 取得預設的輸出檔案路徑
 * Get default output file paths.
 *
 * @param type - 資料類型 ("wifi" 或 "charging")
 * @param isRaw - 是否為原始檔案
 * @returns 檔案路徑
 */
export function getOutputPath(type: "wifi" | "charging", isRaw: boolean = false): string
{
	const prefix = type === "wifi" ? "wifi-hotspots" : "charging-stations";
	const suffix = isRaw ? "-raw" : "";
	return resolve(DEFAULT_OUTPUT_DIR, `${prefix}${suffix}.json`);
}
