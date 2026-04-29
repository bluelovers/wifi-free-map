import { EnumRectifyRangeAspectRatioMode, IGpsLngLatMinMax } from '../grid/grid-types';
import { rectifyRangeAspectRatio } from './geo-math';

export interface IOptionsExpandRangeBounds
{
	rectifyRangeAspectRatioMode?: EnumRectifyRangeAspectRatioMode | boolean;
}

/**
 * 擴張地理範圍 (向外延伸)
 * Expands the geographic range outwards
 *
 * @param range - 原始範圍 / Original range
 * @param offset - 擴張程度（度數）/ Expansion offset in degrees
 *
 */
export function expandRangeLngLatMinMax(range: IGpsLngLatMinMax, offset: number, opts?: IOptionsExpandRangeBounds): IGpsLngLatMinMax
{
	let offsetLng = offset;
	let offsetLat = offset;

	const rectifyRangeAspectRatioMode = opts?.rectifyRangeAspectRatioMode;

	if (rectifyRangeAspectRatioMode === EnumRectifyRangeAspectRatioMode.ADJUST_LNG || rectifyRangeAspectRatioMode === true)
	{
		offsetLng = offset / rectifyRangeAspectRatio({ lat: range.minLat });
	}
	else if (rectifyRangeAspectRatioMode === EnumRectifyRangeAspectRatioMode.ADJUST_LAT)
	{
		offsetLat = offset * rectifyRangeAspectRatio({ lat: range.minLat });
	}

	return {
		minLng: range.minLng - offsetLng,
		maxLng: range.maxLng + offsetLng,
		minLat: range.minLat - offsetLat,
		maxLat: range.maxLat + offsetLat,
	};
}

/**
 * 縮減地理範圍 (向內收縮)
 * Shrinks the geographic range inwards
 */
export function shrinkRangeLngLatMinMax(range: IGpsLngLatMinMax, offset: number, opts?: IOptionsExpandRangeBounds): IGpsLngLatMinMax
{
	// 實際上就是 expandRange 的負值操作
	return expandRangeLngLatMinMax(range, -offset, opts);
}
