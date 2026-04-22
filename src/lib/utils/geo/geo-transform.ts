import {
	IGeoBounds,
	IGeoCoord,
	IGeoPointTupleLatLng,
	IGeolocationApiCoord,
	IGpsLngLatMax,
	IGpsLngLatMin,
	IGpsLngLatMinMax,
} from '@/lib/utils/grid/grid-types';
import {
	GLOBAL_GRID_CONFIG_FACTOR,
	GLOBAL_GRID_CONFIG_PRECISION,
	GLOBAL_GRID_CONFIG_PRECISION_MAKRER,
} from '@/lib/utils/grid/grid-const';

/**
 * 將陣列格式轉為物件格式 `[lat, lng]` -> `{lng, lat}`
 * 注意：Array 通常是 Leaflet/Google Maps 慣用的 `[lat, lng]`, y lat 在前, x lng 在後
 *
 * @param {[lat: number, lng: number]} pointTupleLatLng
 * @returns {IGeoCoord}
 */
export function wrapCoordinateFromPointTupleLatLng(pointTupleLatLng: IGeoPointTupleLatLng): IGeoCoord
{
	return {
		lng: pointTupleLatLng[1],
		lat: pointTupleLatLng[0],
	};
}

export function wrapCoordinateFromGeolocationCoordinates(geolocationCoordinates: IGeolocationApiCoord): IGeoCoord
{
	return normalizeCoordToMarkerPrecision({
		lng: geolocationCoordinates.longitude,
		lat: geolocationCoordinates.latitude,
	});
}

/**
 * 將物件格式轉回陣列格式 `{lng, lat}` -> `[lat, lng]`
 * 注意: y lat 在前, x lng 在後
 */
export function wrapPointTupleLatLngFromCoordinate(coord: IGeoCoord): IGeoPointTupleLatLng
{
	return [coord.lat, coord.lng];
}

export function wrapCoordinate(lng: number, lat: number): IGeoCoord
{
	return {
		lng,
		lat,
	};
}

export function wrapLngLatMin(minLng: number, minLat: number): IGpsLngLatMin
{
	return {
		minLng,
		minLat,
	};
}

export function wrapLngLatMinFromCoord(coord: IGeoCoord): IGpsLngLatMin
{
	return {
		minLng: coord.lng,
		minLat: coord.lat,
	};
}

export function wrapCoordFromLngLatMin(minLngLat: IGpsLngLatMin): IGeoCoord
{
	return {
		lng: minLngLat.minLng,
		lat: minLngLat.minLat,
	};
}

/**
 * 座標修正核心（單一數值）
 * Coordinate fix core (single value)
 *
 * 將座標修正到指定精度
 * Fixes coordinate to specified precision
 *
 * @param coord - 座標值 / Coordinate value
 * @param precision - 精度 / Precision
 * @returns 修正後的座標值 / Fixed coordinate value
 */
export function _normalizeCoordScalarCore(coord: number, precision?: number)
{
	/** 使用 toFixed 固定精度，再.parseFloat 確保數字類型 / Use toFixed, then parseFloat to ensure number type */
	return parseFloat(coord.toFixed(precision ?? GLOBAL_GRID_CONFIG_PRECISION));
}

/**
 * 從字串修正座標核心
 * Fix coordinate from string core
 *
 * 將字串或數字轉換為修正後的座標
 * Converts string or number to fixed coordinate
 *
 * @param coord - 座標（數字或字串）/ Coordinate (number or string)
 * @param precision - 精度（可選）/ Precision (optional)
 * @returns 修正後的座標值 / Fixed coordinate value
 */
export function _normalizeCoordScalarFromStringNumberCore(coord: number | string, precision?: number)
{
	return _normalizeCoordScalarCore(Number(coord), precision);
}

/**
 * 將座標修正到指定精度
 * Fixes coordinates to specified precision
 *
 * 避免浮點數微差導致網格計算錯誤
 *
 * @param coord - GEO 座標 / GEO coordinate
 * @param precision - 精度（可選）/ Precision (optional)
 * @returns 修正後的座標 / Fixed coordinates
 */
export function normalizeCoord(coord: IGeoCoord, precision?: number): IGeoCoord
{
	return {
		lng: _normalizeCoordScalarCore(coord.lng, precision),
		lat: _normalizeCoordScalarCore(coord.lat, precision),
	};
}

/**
 * 將座標修正到標記精度
 * Fixes coordinates to marker precision
 *
 * @param coord - GEO 座標 / GEO coordinate
 * @returns 修正後的座標 / Fixed coordinates
 */
export function normalizeCoordToMarkerPrecision(coord: IGeoCoord): IGeoCoord
{
	return normalizeCoord(coord, GLOBAL_GRID_CONFIG_PRECISION_MAKRER);
}

export function normalizePointTupleLatLngToMarkerPrecision(pointTupleLatLng: IGeoPointTupleLatLng): IGeoPointTupleLatLng
{
	return [
		_normalizeCoordScalarCore(pointTupleLatLng[0], GLOBAL_GRID_CONFIG_PRECISION_MAKRER),
		_normalizeCoordScalarCore(pointTupleLatLng[1], GLOBAL_GRID_CONFIG_PRECISION_MAKRER),
	];
}

/**
 * 將經緯度轉為「整數座標」
 * 使用整數化後的座標比較，避免浮點數誤差導致的排序抖動
 */
export function _toInternalCoordIntScalar(val: number): number
{
	return Math.floor(val * GLOBAL_GRID_CONFIG_FACTOR);
}

/**
 * 將整數座標還原為「浮點經緯度」
 * 注意：此函數僅用於還原座標，不應用於排序比較。
 * 並且並非真實原始座標，僅為近似值
 */
export function _fromInternalCoordIntScalar(intVal: number): number
{
	return intVal / GLOBAL_GRID_CONFIG_FACTOR;
}

/**
 * 邊界轉最小經緯度
 * Bounds to min longitude/latitude
 *
 * 從邊界取得最小座標（西南角）
 * Gets minimum coordinates from bounds (southwest corner)
 *
 * @param bounds - 四角座標邊界 / Four corner bounds
 * @returns 最小經緯度 / Min longitude/latitude
 */
export function _boundsToLngLatMin(bounds: IGeoBounds): IGpsLngLatMin
{
	/** 使用西南角作為最小座標 / Use southwest corner as minimum coordinates */
	return {
		minLng: bounds.southWest.lng,
		minLat: bounds.southWest.lat,
	}
}

/**
 * 邊界轉最大經緯度
 * Bounds to max longitude/latitude
 *
 * 從邊界取得最大座標（東北角）
 * Gets maximum coordinates from bounds (northeast corner)
 *
 * @param bounds - 四角座標邊界 / Four corner bounds
 * @returns 最大經緯度 / Max longitude/latitude
 */
export function _boundsToLngLatMax(bounds: IGeoBounds): IGpsLngLatMax
{
	/** 使用東北角作為最大座標 / Use northeast corner as maximum coordinates */
	return {
		maxLng: bounds.northEast.lng,
		maxLat: bounds.northEast.lat,
	}
}

/**
 * 邊界轉座標範圍
 * Bounds to coordinate range
 *
 * 將四角座標邊界轉換為座標範圍
 * Converts four-corner bounds to coordinate range
 *
 * @param bounds - 四角座標邊界 / Four corner coordinates bounds
 * @returns 座標範圍 / Coordinate range
 */
export function boundsToRangeLngLatMinMax(bounds: IGeoBounds): IGpsLngLatMinMax
{
	const { minLng, minLat } = _boundsToLngLatMin(bounds);
	const { maxLng, maxLat } = _boundsToLngLatMax(bounds);

	return {
		minLng,
		maxLng,
		minLat,
		maxLat,
	};
}

/**
 * 座標範圍轉邊界
 * Coordinate range to bounds
 *
 * 將座標範圍轉換為四角座標邊界
 * Converts coordinate range to four-corner bounds
 *
 * @param range - 座標範圍 / Coordinate range
 * @returns 四角座標邊界 / Four corner coordinates bounds
 */
export function rangeLngLatMinMaxToBounds(range: IGpsLngLatMinMax): IGeoBounds
{
	return {
		/** 西北角座標 / Northwest corner coordinates */
		northWest: normalizeCoord({
			lng: range.minLng,
			lat: range.maxLat,
		}),
		/** 東北角座標 / Northeast corner coordinates */
		northEast: normalizeCoord({
			lng: range.maxLng,
			lat: range.maxLat,
		}),
		/** 西南角座標 / Southwest corner coordinates */
		southWest: normalizeCoord({
			lng: range.minLng,
			lat: range.minLat,
		}),
		/** 東南角座標 / Southeast corner coordinates */
		southEast: normalizeCoord({
			lng: range.maxLng,
			lat: range.minLat,
		}),
	}
}

