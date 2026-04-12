/**
 * 充電站原始資料型別（iTaiwan 提供）
 * Raw charging‑station type from iTaiwan dataset.
 *
 * 注意：此類型對應 transform.ts 中 convertChargingRaw 使用的鍵名格式（中文鍵名）
 * Note: This type corresponds to the key format (Chinese keys) used by convertChargingRaw in transform.ts
 */
export interface RawChargingStation
{
	/** 站點名稱 */
	// Station name
	"充電站名稱": string;
	/** 緯度 */
	// Latitude
	"緯度": string;
	/** 經度 */
	// Longitude
	"經度": string;
	/** 地址 */
	// Address
	"地址": string;

	[key: string]: any; // 其他欄位保留
}

/**
 * 過濾後的充電站型別，供前端使用
 * Filtered charging‑station type for front‑end consumption.
 */
export interface ChargingStation
{
	/** 站點名稱 */
	// Station name
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
 * Map raw data to the filtered ChargingStation type.
 *
 * 注意：此函數對應 transform.ts 中的 convertChargingRaw 函數，使用中文鍵名映射
 * Note: This function corresponds to convertChargingRaw in transform.ts, using Chinese key mapping
 */
/**
 * 將原始資料映射成過濾後的型別（已棄用）
 * Map raw data to the filtered ChargingStation type (deprecated).
 *
 * 此函式現在直接委派給 lib/transform 中的 convertChargingRaw，以保持一致的鍵名映射。
 * This function now delegates to convertChargingRaw from lib/transform to ensure consistent key mapping.
 */
import { convertChargingRaw } from "../lib/transform";

export function mapRawToCharging(raw: RawChargingStation): ChargingStation
{
	// 保持相容性，直接呼叫新的實作
	return convertChargingRaw(raw);
}
