import { IGpsLngLatMinMax } from '../grid/grid-types';

/**
 * 擴張地理範圍 (向外延伸)
 * Expands the geographic range outwards
 * * @param range - 原始範圍 / Original range
 * @param offset - 擴張程度（度數）/ Expansion offset in degrees
 */
export function expandRangeLngLatMinMax(range: IGpsLngLatMinMax, offset: number): IGpsLngLatMinMax
{
	return {
		minLng: range.minLng - offset,
		maxLng: range.maxLng + offset,
		minLat: range.minLat - offset,
		maxLat: range.maxLat + offset,
	};
}

/**
 * 縮減地理範圍 (向內收縮)
 * Shrinks the geographic range inwards
 */
export function shrinkRangeLngLatMinMax(range: IGpsLngLatMinMax, offset: number): IGpsLngLatMinMax
{
	// 實際上就是 expandRange 的負值操作
	return expandRangeLngLatMinMax(range, -offset);
}
