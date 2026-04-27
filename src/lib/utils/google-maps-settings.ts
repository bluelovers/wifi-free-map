/**
 * Google Maps 設定工具
 * Google Maps settings utilities
 *
 * 提供 Google Maps 設定的本地儲存功能
 * Provides local storage for Google Maps settings
 */

import { EnumGoogleMapsMode } from './google-maps-url';

/** localStorage 鍵名 / localStorage key name */
const GOOGLE_MAPS_MODE_KEY = 'google-maps-mode';

/**
 * 取得儲存的 Google Maps 模式
 * Get saved Google Maps mode
 *
 * @returns 儲存的模式，若無則回傳預設 Web 模式 / Saved mode, default to Web if not set
 */
export function getGoogleMapsMode(): EnumGoogleMapsMode
{
	if (typeof window === 'undefined') return EnumGoogleMapsMode.Web;

	try
	{
		const saved = localStorage.getItem(GOOGLE_MAPS_MODE_KEY);
		if (!saved) return EnumGoogleMapsMode.Web;

		// 驗證是否為有效的模式 / Validate if it's a valid mode
		const validModes = Object.values(EnumGoogleMapsMode);
		if (validModes.includes(saved as EnumGoogleMapsMode))
		{
			return saved as EnumGoogleMapsMode;
		}
	}
	catch
	{
		// localStorage 可能不可用 / localStorage may not be available
	}

	return EnumGoogleMapsMode.Web;
}

/**
 * 儲存 Google Maps 模式
 * Save Google Maps mode
 *
 * @param mode - 要儲存的模式 / Mode to save
 */
export function setGoogleMapsMode(mode: EnumGoogleMapsMode): void
{
	if (typeof window === 'undefined') return;

	try
	{
		localStorage.setItem(GOOGLE_MAPS_MODE_KEY, mode);
	}
	catch
	{
		// localStorage 可能不可用 / localStorage may not be available
	}
}

