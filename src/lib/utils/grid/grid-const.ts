/**
 * Created by user on 2026/4/14.
 */

/** 區塊大小（萬華區的座標範圍） */
export const BLOCK_SIZE = 0.0306959;
/** 全台灣座標範圍 */
export const TAIWAN_BOUNDS = {
	minLat: 21.903126,
	maxLat: 26.3758,
	minLng: 118.2257211,
	maxLng: 121.948,
} as const;

/** 資料類型設定 */
export const DATA_TYPES = [
	{ type: "wifi", dir: "grid-wifi", prefix: "grid-wifi/" },
	{ type: "charging", dir: "grid-charging", prefix: "grid-charging/" },
] as const;
