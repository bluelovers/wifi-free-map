
import { IGpsCoordinate } from '@/lib/utils/grid/grid-types';

/**
 * 計算兩點之間的直線距離
 * Calculate straight-line distance between two coordinates
 *
 * 使用 Haversine 公式計算地球表面兩點間的距離
 * Uses Haversine formula to calculate distance on Earth's surface
 *
 * @param from - 起點座標 / Starting coordinates
 * @param to - 終點座標 / Destination coordinates
 * @returns 距離（公尺）/ Distance (in meters)
 */
export function calculateDistance(from: IGpsCoordinate, to: IGpsCoordinate): number
{
	const R = 6371e3; // 地球半徑（公尺）
	const φ1 = (from.lat * Math.PI) / 180;
	const φ2 = (to.lat * Math.PI) / 180;
	const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
	const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // 距離（公尺）
}

/**
 * 格式化距離為人類可讀的格式
 * Format distance to human-readable format
 *
 * @param distM - 距離（公尺）/ Distance (in meters)
 * @returns 格式化後的字串 / Formatted string
 */
export function formatDistance(distM: number)
{
	if (distM < 1000)
	{
		return `${Math.round(distM)} 公尺`;
	}
	return `${(distM / 1000).toFixed(1)} 公里`;
}

/**
 * 計算並格式化距離
 * Calculate and format distance
 *
 * @param from - 起點座標 / Starting coordinates
 * @param to - 終點座標 / Destination coordinates
 * @returns 格式化後的距離字串 / Formatted distance string
 */
export function getAndFormatDistance(from: IGpsCoordinate, to: IGpsCoordinate)
{
	const dist = calculateDistance(from, to);
	return formatDistance(dist);
}
