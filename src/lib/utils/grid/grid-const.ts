/**
 * 網格計算常數定義
 * Grid computation constants for geographic data processing.
 */

import { IGpsLngLatMinMax } from "./grid-types";

/**
 * 區塊大小（萬華區的座標範圍）原始值為 0.0306959
 * Block size (Wanhua district coordinate range) original value is 0.0306959
 *
 * 為了方便計算，這裡調整為 0.02
 * 大約是從萬華車站走到西門町的距離。
 * 這對使用者最友善，因為「附近的充電站」通常就在這個範圍內。
 * For convenient calculation, adjusted to 0.02 here.
 * Approximately the distance from Wanhua Station to Ximen Area.
 * Most user-friendly as "nearby charging stations" usually fall within this range.
 */
export const BLOCK_SIZE = 0.02;

/**
 * 台灣地理邊界
 * Taiwan geographic boundaries
 */
export const TAIWAN_BOUNDS: IGpsLngLatMinMax = {
	/** 稍微南移，對齊 0.1 原始值為 21.903126 / Slightly south, align to 0.1 original value 21.903126 */
	minLat: 21.90,
	/** 稍微北移，對齊 0.1 原始值為 26.3758 / Slightly north, align to 0.1 original value 26.3758 */
	maxLat: 26.40,
	/** 向西擴展到 118 整數，對齊金馬與澎湖海域 原始值為 118.2257211 / Expand west to 118, align to Kinmen/Matsu/Penghu waters original value 118.2257211 */
	minLng: 118.00,
	/** 向東擴展到 122 整數 / Expand east to 122 */
	maxLng: 122.00,
} as const;

/**
 * 資料類型設定
 * Data type configuration
 *
 * 用於區分不同類型的地理資料（如 WiFi 熱點、充電站等）
 * Used to differentiate different types of geographic data (e.g., WiFi hotspots, charging stations)
 */
export const DATA_TYPES = [
	{ type: "wifi", dir: "grid-wifi", prefix: "grid-wifi/" },
	{ type: "charging", dir: "grid-charging", prefix: "grid-charging/" },
] as const;
