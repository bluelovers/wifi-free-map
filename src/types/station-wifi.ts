import { IStationBase } from '@/types/station-base';

/**
 * Wi‑Fi 熱點原始資料型別（iTaiwan 提供）
 * Raw Wi‑Fi hotspot type from iTaiwan dataset.
 *
 * 注意：此類型對應 transform.ts 中 convertWiFiRaw 使用的鍵名格式
 * Note: This type corresponds to the key format used by convertWiFiRaw in transform.ts
 */
export interface IRawHotspot
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
export interface IHotspot extends IStationBase
{

}
