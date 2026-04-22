import { IFnGeoCoordProximity, IGeoCoord } from '@/lib/utils/grid/grid-types';
import { calculateSquaredDistance } from '@/lib/utils/geo/geo-math';

/**
 * 依據相對距離排序 (效能優化版)
 * 適用於大量點位的快速排序。
 */
export function sortByProximityFast<T extends IGeoCoord>(coords: T[], center: IGeoCoord): T[]
{
	return coords.sort(_createProximityComparator(center, calculateSquaredDistance))
}

export function _createProximityComparator(center: IGeoCoord, fnProximity: IFnGeoCoordProximity)
{
	return <T extends IGeoCoord>(coordA: T, coordB: T) =>
	{
		return fnProximity(center, coordA) - fnProximity(center, coordB);
	}
}
