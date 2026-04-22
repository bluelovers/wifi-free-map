import { IGeoPointTupleLatLng, IFormatBlockKey, IGeoCoord } from '@/lib/utils/grid/grid-types';
import { IOptionsFormatBlockKey } from '@/lib/utils/grid/grid-types-opts';
import { GLOBAL_GRID_CONFIG_PRECISION, GLOBAL_GRID_CONFIG_PRECISION_MAKRER } from '@/lib/utils/grid/grid-const';
import { _normalizeCoordScalarCore, wrapCoordinateFromPointTupleLatLng } from '@/lib/utils/geo/geo-transform';
import { calculateDistance } from '@/lib/utils/geo/geo-math';

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
 * 標準十進位格式 (Decimal Degrees, DD)
 * 格式：[Lat, Lng] (符合 Google Maps 搜尋習慣)
 * 範例："25.0200, 121.4800"
 */
export function formatToDD(coord: IGeoCoord, precision = 6): string
{
	return `${coord.lat.toFixed(precision)}, ${coord.lng.toFixed(precision)}`;
}

export function _formatToDDMCore(val: number, pos: string, neg: string)
{
	const abs = Math.abs(val);
	const deg = Math.floor(abs);
	const min = ((abs - deg) * 60).toFixed(3);
	const dir = val >= 0 ? pos : neg;
	return `${deg}° ${min}' ${dir}`;
}

/**
 * 度分格式 (Degrees Decimal Minutes, DDM)
 * 格式：Degrees° Minutes' Direction
 * 範例："25° 01.200' N, 121° 28.800' E"
 */
export function formatToDDM(coord: IGeoCoord): string
{

	return `${_formatToDDMCore(coord.lat, 'N', 'S')}, ${_formatToDDMCore(coord.lng, 'E', 'W')}`;
}

export function _formatToDMSCore(val: number, pos: string, neg: string)
{
	const abs = Math.abs(val);
	const deg = Math.floor(abs);
	const minVal = (abs - deg) * 60;
	const min = Math.floor(minVal);
	const sec = ((minVal - min) * 60).toFixed(1);
	const dir = val >= 0 ? pos : neg;
	return `${deg}° ${min}' ${sec}" ${dir}`;
}

/**
 * 度分秒格式 (Degrees Minutes Seconds, DMS)
 * 格式：Degrees° Minutes' Seconds" Direction
 * 範例："25° 01' 12.0\" N, 121° 28' 48.0\" E"
 */
export function formatToDMS(coord: IGeoCoord): string
{

	return `${_formatToDMSCore(coord.lat, 'N', 'S')}, ${_formatToDMSCore(coord.lng, 'E', 'W')}`;
}

/**
 * 格式化區塊鍵值
 * Format block key
 *
 * 將座標轉換為格式化的鍵值字串
 * Converts coordinates to formatted key string
 *
 * @param x_lng - X 座標（經度）/ X coordinate (longitude)
 * @param y_lat - Y 座標（緯度）/ Y coordinate (latitude)
 * @param opts - 選項 / Options
 * @param opts.sep - 分隔符（預設 "_"）/ Separator (default "_")
 * @returns 格式化後的鍵值 / Formatted key
 */
export function _formatBlockKey<S extends string = '_'>(x_lng: number | string,
	y_lat: number | string,
	opts?: IOptionsFormatBlockKey<S>,
): IFormatBlockKey<S>
{
	/** 取得精度，預設使用全局精度配置 / Get precision, default to global precision config */
	const precision = opts?.precision ?? GLOBAL_GRID_CONFIG_PRECISION;

	/** 將數字轉換為固定精度字串 / Convert number to fixed precision string */
	const lngStr = typeof x_lng === 'number' ? x_lng.toFixed(precision) : x_lng;
	const latStr = typeof y_lat === 'number' ? y_lat.toFixed(precision) : y_lat;

	/** 取得分隔符，預設為底線 / Get separator, default to underscore */
	const sep = opts?.sep ?? '_';

	/** 組合為格式化的鍵值字串 / Combine into formatted key string */
	return `${lngStr}${sep}${latStr}` as IFormatBlockKey<S>;
}

export function _decodeBlockKeyCore<S extends string = '_'>(key: IFormatBlockKey<S>,
	opts?: IOptionsFormatBlockKey<S>,
): IGeoPointTupleLatLng
{
	const sep = opts?.sep ?? '_';
	const precision = opts?.precision ?? GLOBAL_GRID_CONFIG_PRECISION_MAKRER;
	const [lng, lat] = key.split(sep);

	return [_normalizeCoordScalarCore(parseFloat(lat), precision), _normalizeCoordScalarCore(parseFloat(lng), precision)];
}

export function decodeBlockKey<S extends string = '_'>(key: IFormatBlockKey<S>,
	opts?: IOptionsFormatBlockKey<S>,
): IGeoCoord
{
	return wrapCoordinateFromPointTupleLatLng(_decodeBlockKeyCore<S>(key, opts));
}

/**
 * 計算並格式化距離
 * Calculate and format distance
 *
 * @param from - 起點座標 / Starting coordinates
 * @param to - 終點座標 / Destination coordinates
 * @returns 格式化後的距離字串 / Formatted distance string
 */
export function getAndFormatDistance(from: IGeoCoord, to: IGeoCoord)
{
	const dist = calculateDistance(from, to);
	return formatDistance(dist);
}
