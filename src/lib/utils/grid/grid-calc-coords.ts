// 計算距離
import { IGpsCoordinate } from '@/lib/utils/grid/grid-types';

/**
 * 計算兩點之間的距離（公尺）
 * Calculate distance between two points (meters)
 *
 * @returns 距離（公尺）
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

export function formatDistance(distM: number)
{
	if (distM < 1000)
	{
		return `${Math.round(distM)} 公尺`;
	}
	return `${(distM / 1000).toFixed(1)} 公里`;
}

export function getAndFormatDistance(from: IGpsCoordinate, to: IGpsCoordinate)
{
	const dist = calculateDistance(from, to);
	return formatDistance(dist);
}
