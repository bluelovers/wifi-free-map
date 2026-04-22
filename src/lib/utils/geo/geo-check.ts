import { IGeoCoord, IGpsLngLatMinMax } from '@/lib/utils/grid/grid-types';
import { normalizeCoordToMarkerPrecision } from './geo-transform';

export function validateCoordinate(coord: IGeoCoord): asserts coord is IGeoCoord
{
	if (coord.lat < -90 || coord.lat > 90)
	{
		throw new RangeError(`無效的緯度: ${coord.lat}。緯度應介於 -90 與 90 之間。`);
	}
	if (coord.lng < -180 || coord.lng > 180)
	{
		throw new RangeError(`無效的經度: ${coord.lng}。經度應介於 -180 與 180 之間。`);
	}
}

/**
 * 優化效能版：減少屬性查找並利用早退邏輯
 */
export function isCoordWithinRange(coord: IGeoCoord, range: IGpsLngLatMinMax): boolean
{
	const { lng, lat } = coord;

	if (
		/** 優先檢查通常跨度較大的緯度（或是根據你的資料分佈調整） */
		lat < range.minLat || lat >= range.maxLat
		/** */
		|| lng < range.minLng || lng >= range.maxLng
	)
	{
		return false;
	}

	return true;
}

export function isSameCoordCore<T extends IGeoCoord>(coordA: T, coordB: NoInfer<T>): coordB is {
	lat: T['lat'];
	lng: T['lng'];
}
{
	return coordA.lat === coordB.lat && coordA.lng === coordB.lng;
}

export function isSameCoord<T extends IGeoCoord>(coordA: T, coordB: NoInfer<T>): coordB is {
	lat: T['lat'];
	lng: T['lng'];
}
{
	coordA = normalizeCoordToMarkerPrecision(coordA) as T;
	coordB = normalizeCoordToMarkerPrecision(coordB);

	return isSameCoordCore(coordA, coordB);
}
