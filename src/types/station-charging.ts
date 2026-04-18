import { IStationBase } from '@/types/station-base';

/**
 * 充電站原始資料型別（iTaiwan 提供）
 * Raw charging‑station type from iTaiwan dataset.
 *
 * 注意：此類型對應 transform.ts 中 convertChargingRaw 使用的鍵名格式（中文鍵名）
 * Note: This type corresponds to the key format (Chinese keys) used by convertChargingRaw in transform.ts
 */
export interface IRawChargingStation
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
export interface IChargingStation extends IStationBase
{

}
