/**
 * Created by user on 2026/4/14.
 */

/**
 * 區塊大小（萬華區的座標範圍）原始值為 0.0306959
 *
 * 為了方便計算，這裡調整為 0.02
 * 大約是從萬華車站走到西門町的距離。
 * 這對使用者最友善，因為「附近的充電站」通常就在這個範圍內。
 */
export const BLOCK_SIZE = 0.02;

/** 全台灣座標範圍 */
export const TAIWAN_BOUNDS = {
	/** 稍微南移，對齊 0.1 原始值為 21.903126 */
  minLat: 21.90,
  /** 稍微北移，對齊 0.1 原始值為 26.3758 */
  maxLat: 26.40,
  /** 向西擴展到 118 整數，對齊金馬與澎湖海域 原始值為 118.2257211 */
  minLng: 118.00,
  /** 向東擴展到 122 整數 */
  maxLng: 122.00,
} as const;

/** 資料類型設定 */
export const DATA_TYPES = [
	{ type: "wifi", dir: "grid-wifi", prefix: "grid-wifi/" },
	{ type: "charging", dir: "grid-charging", prefix: "grid-charging/" },
] as const;
