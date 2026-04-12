/**
 * Wi‑Fi 熱點原始資料型別（iTaiwan 提供）
 * Raw Wi‑Fi hotspot type from iTaiwan dataset.
 *
 * 注意：此類型對應 transform.ts 中 convertWiFiRaw 使用的鍵名格式
 * Note: This type corresponds to the key format used by convertWiFiRaw in transform.ts
 */
export interface RawHotspot
{
	/** 熱點名稱 */
	// Hotspot name
	Name: string;
	/** 緯度 */
	// Latitude
	Latitude: string;
	/** 經度 */
	// Longitude
	Longitude: string;
	/** 地址 */
	// Address
	Address: string;

	[key: string]: any; // 其他欄位保留
}

/**
 * 過濾後的 Wi‑Fi 熱點型別，供前端使用
 * Filtered hotspot type for front‑end consumption.
 */
export interface Hotspot
{
	/** 熱點名稱 */
	// Hotspot name
	name: string;
	/** 緯度 */
	// Latitude
	lat: number;
	/** 經度 */
	// Longitude
	lng: number;
	/** 地址 */
	// Address
	address: string;
}

/**
 * 將原始資料映射成過濾後的型別
 * Map raw data to the filtered Hotspot type.
 *
 * 注意：此函數對應 transform.ts 中的 convertWiFiRaw 函數，保持一致的鍵名映射
 * Note: This function corresponds to convertWiFiRaw in transform.ts, maintaining consistent key mapping
 */
/**
 * 將原始資料映射成過濾後的型別（已棄用）
 * Map raw data to the filtered Hotspot type (deprecated).
 *
 * 此函式現在直接委派給 lib/transform 中的 convertWiFiRaw 以確保行為一致。
 * This function now delegates to convertWiFiRaw from lib/transform to ensure consistent behavior.
 */
import { convertWiFiRaw } from "../lib/transform";

export function mapRawToHotspot(raw: RawHotspot): Hotspot
{
	// 保持相容性，直接呼叫新的實作
	return convertWiFiRaw(raw);
}
