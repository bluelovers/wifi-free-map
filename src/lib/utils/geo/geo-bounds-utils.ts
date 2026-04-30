import { BLOCK_SIZE_SNAPPED, GLOBAL_GRID_CONFIG_ORIGIN, GLOBAL_GRID_CONFIG_PRECISION } from '../grid/grid-const';
import { _calCoordScalarToBlockIndexCore, _calcBlockIndexToRangeScalarCore } from '../grid/grid-transform';
import { EnumRectifyRangeAspectRatioMode, IGeoCoord, IGpsLngLatMinMax } from '../grid/grid-types';
import { rectifyRangeAspectRatio } from './geo-math';
import { _normalizeCoordScalarCore } from './geo-transform';

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

export function _getSnappedCoordScalarCore(val: number, base: number, snapSize: number, toCenter?: boolean)
{
	/** 1. 取得迷你網格索引 */
	const idx = _calCoordScalarToBlockIndexCore(val, base, snapSize);
	/** 2. 轉回座標並偏移至該網格中心 (避免邊界切換過於敏感) */
	return _normalizeCoordScalarCore(
		_calcBlockIndexToRangeScalarCore(idx, base, snapSize) + (toCenter ? (snapSize * 0.5) : 0),
		GLOBAL_GRID_CONFIG_PRECISION
	);
}

/**
 * 將座標對齊到指定大小的網格中心
 * @param coord 原始座標
 * @param snapSize 緩存網格大小 (預設 0.005)
 */
export function getSnappedCoord(coord: IGeoCoord, snapSize: number = BLOCK_SIZE_SNAPPED): IGeoCoord
{
	return {
		lng: _getSnappedCoordScalarCore(coord.lng, GLOBAL_GRID_CONFIG_ORIGIN.lng, snapSize, true),
		lat: _getSnappedCoordScalarCore(coord.lat, GLOBAL_GRID_CONFIG_ORIGIN.lat, snapSize, true),
	};
}
