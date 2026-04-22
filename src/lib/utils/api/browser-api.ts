import { wrapCoordinateFromGeolocationCoordinates } from '../geo/geo-transform';
import { IGeoCoord } from '../grid/grid-types';

/**
 * 複製文字至剪貼簿
 * Copy text to clipboard
 *
 * 使用 navigator.clipboard API 複製文字
 * Uses navigator.clipboard API to copy text
 *
 * @param text - 要複製的文字 / Text to copy
 */
export async function copyPassword(text: string): Promise<void>
{
	try
	{
		await navigator.clipboard.writeText(text);
		alert('已複製 / Copied!');
	}
	catch
	{
		alert('複製失敗 / Copy failed');
	}
}

/**
 * 請求地理定位權限
 * Request geolocation permissions
 *
 * 檢查瀏覽器是否支援並查詢地理定位權限狀態
 * Checks if browser supports and queries geolocation permission status
 *
 * @returns 權限狀態或 undefined / Permission status or undefined
 */
export async function requestPermissionsGeolocation(): Promise<PermissionStatus | undefined>
{
	if (typeof navigator !== 'undefined')
	{
		return navigator.permissions?.query({
				name: 'geolocation' as PermissionName,
			})
			.then((result) =>
			{
				if (result.state === 'denied')
				{
					const e = new Error('Geolocation denied');
					e.cause = result;
					return Promise.reject(e);
				}
				console.log('取得定位權限或位置', result);

				return result
			})
			.catch((error: Error) =>
			{
				console.error('取得定位權限或位置時發生錯誤', error);
				return Promise.reject(error)
			})
	}
}

/**
 * 取得地理定位位置的核心函式
 * Core function for getting geolocation position
 *
 * @param resolve - 成功回調函式 / Success callback function
 * @param reject - 失敗回調函式 / Error callback function
 */
export function _getGeolocationPositionCore(resolve: (position: GeolocationPosition) => void,
	reject: (error: GeolocationPositionError) => void,
)
{
	navigator.geolocation.getCurrentPosition(resolve, reject);
}

/**
 * 取得地理定位位置
 * Get geolocation position
 *
 * @returns 包含位置資訊的 Promise / Promise with position information
 */
export function getGeolocationPosition(): Promise<GeolocationPosition>
{
	return new Promise(_getGeolocationPositionCore);
}

export interface IGeolocationResult
{
	coord: IGeoCoord;
	geoApiPosition: GeolocationPosition;
}

/**
 * 取得 GPS 權限並嘗試獲取使用者位置
 */
export function requestGeoPermissionsAndPosition(): Promise<IGeolocationResult>
{
	return requestPermissionsGeolocation()
		.then(result =>
		{
			return getGeolocationPosition()
		})
		.then(geoApiPosition =>
		{
			const coord = wrapCoordinateFromGeolocationCoordinates(geoApiPosition.coords);

			return {
				coord,
				geoApiPosition,
			}
		})
}
