/**
 * Google Maps URL 工具
 * Google Maps URL utilities
 *
 * 提供產生 Google Maps URL 的功能，支援 Web URL 和 App Deep Link 兩種模式
 * Provides generating Google Maps URLs, supporting Web URL and App Deep Link modes
 */

import { IGeoBlockGridIndexRange, IGeoCoord } from '@/lib/utils/grid/grid-types';
import { ITSPartialPick } from 'ts-type';
import { IStationBase } from '@/types/station-base';

/**
 * Google Maps 開啟模式
 * Google Maps opening mode
 */
export enum EnumGoogleMapsMode
{
	/** Web URL 模式 (預設) */
	Web = 'web',
	/** App Deep Link 模式 */
	App = 'app',
	/** Web URL 模式 - 僅名稱 */
	WebName = 'web-name',
	/** Web URL 模式 - 座標 */
	WebCoord = 'web-coord',
	/** Web URL 模式 - 座標+名稱 */
	WebCoordName = 'web-coord-name',
	/** Web URL 模式 - 座標+地址 */
	WebCoordAddress = 'web-coord-address',
	/** Web URL 模式 - 地址+名稱 */
	WebAddressName = 'web-address-name',

	/** Web URL 模式 - 自動選擇 */
	WebAuto = 'web-auto',
}

/**
 * Google Maps 查詢選項
 * Google Maps query options
 */
export interface IGoogleMapsQueryOptions
{
	/** 開啟模式（預設為 Web）/ Opening mode (default: Web) */
	mode?: EnumGoogleMapsMode;
	/** 是否為導航模式 / Navigation mode */
	isNavigation?: boolean;
}

/**
 * 構建網頁搜尋 URL
 * Build web search URL
 */
function buildWebSearchUrl(query: string): string
{
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * 構建導航 URL
 * Build navigation URL
 */
function buildNavUrl(dest: string): string
{
	return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

/**
 * 產生 Google Maps URL - 統一函式
 * Generate Google Maps URL - Unified function
 *
 * @param options - 查詢選項 / Query options
 * @returns Google Maps URL
 * @throws 若無法產生 URL則拋出錯誤 / Throws error if URL cannot be generated
 */
export function generateGoogleMapsUrl(item: ITSPartialPick<IStationBase, 'name' | 'address' | 'lat' | 'lng'>, options: IGoogleMapsQueryOptions): string
{

	let coord: IGeoCoord = (item.lat || item.lng) ? item as any : null;

	// 驗證必須，至少要有 coord, name, 或 address 其一
	if (!coord! && !item.name && !item.address)
	{
		throw new Error(`Maps URL[${options.mode}]: 至少需要提供 coord、name 或 address 其中之一`);
	}

	const mode = options.mode || EnumGoogleMapsMode.Web;
	const isNavigation = options.isNavigation || false;
	const { name, address } = item;

	const queryLatLng = coord ? `${item.lat},${item.lng}` : '';

	function requireCoord(coord: IGeoCoord | undefined): asserts coord is IGeoCoord
	{
		if (!coord) throw new Error(`Maps URL[${mode}]: 需要提供座標`);
	}

	function _labelTag(value: string): string
	{
		return ` (${value})`;
	}

	let query = queryLatLng;

	if (mode === EnumGoogleMapsMode.App)
	{
		requireCoord(coord);

		const suffix = isNavigation ? '&mode=n' : '';

		if (name)
		{
			query += _labelTag(name);
		}
		else if (address)
		{
			query += _labelTag(address);
		}

		return `geo:${queryLatLng}?q=${encodeURIComponent(query)}${suffix}`;
	}

	// Web 模式處理
	switch (mode)
	{
		case EnumGoogleMapsMode.WebName:

			if (name)
			{
				query = name;
			}

			break;
		case EnumGoogleMapsMode.WebCoordName:
			requireCoord(coord);

			if (name)
			{
				query += _labelTag(name);
			}

			break;

		case EnumGoogleMapsMode.WebCoordAddress:
			requireCoord(coord);

			if (address)
			{
				query += _labelTag(address);
			}

			break;

		case EnumGoogleMapsMode.WebAddressName:


			if (address)
			{
				query = address;
				if (name)
				{
					query += _labelTag(name);
				}
			}
			else if (name)
			{
				query = name;
			}
			else
			{
				throw new Error(`Maps URL[${mode}]: 至少需要提供 address 或 name 其中之一`);
			}

			break;
		case EnumGoogleMapsMode.WebAuto:

			if (coord)
			{
				if (address)
				{
					query += _labelTag(address);
				}
				else if (name)
				{
					query += _labelTag(name);
				}
			}
			else if (address)
			{
				query = address;
				if (name)
				{
					query += _labelTag(name);
				}
			}
			else if (name)
			{
				query = name;
			}
			else
			{
				throw new Error(`Maps URL[${mode}]: 至少需要提供 coord、name 或 address 其中之一`);
			}

			break;
		case EnumGoogleMapsMode.WebCoord:
		case EnumGoogleMapsMode.Web:
		default:
			requireCoord(coord);
			break;
	}

	if (!query.trim())
	{
		throw new Error(`Maps URL[${mode}]: 無法產生查詢字串`);
	}

	if (isNavigation)
	{
		return buildNavUrl(query);
	}

	return buildWebSearchUrl(query);
}

/**
 * 在瀏覽器中開啟 Google 地圖
 * Open Google Maps in browser
 *
 * @param url - Google Maps URL
 */
export function openGoogleMaps(url: string): void
{
	if (typeof window !== 'undefined' && url)
	{
		window.open(url, '_blank', 'noopener,noreferrer');
	}
}

/**
 * 取得显示名称
 * Get display name for mode
 *
 * @param mode - 模式 / Mode
 * @returns 显示名称 / Display name
 */
export function getGoogleMapsModeDisplayName(mode: EnumGoogleMapsMode): string
{
	switch (mode)
	{
		case EnumGoogleMapsMode.App:
			return 'App (地图App)';
		case EnumGoogleMapsMode.WebName:
			return '名称 (Name only)';
		case EnumGoogleMapsMode.WebCoord:
			return '坐标 (Coordinates)';
		case EnumGoogleMapsMode.WebCoordName:
			return '坐标+名称 (Coord + Name)';
		case EnumGoogleMapsMode.WebCoordAddress:
			return '坐标+地址 (Coord + Address)';
		case EnumGoogleMapsMode.WebAddressName:
			return '地址+名称 (Address + Name)';
		case EnumGoogleMapsMode.WebAuto:
			return '自动 (Auto)';
		case EnumGoogleMapsMode.Web:
		default:
			return '坐标 (Coordinates)';
	}
}

/**
 * 取得所有可用模式
 * Get all available modes
 *
 * @returns 模式阵列 / Array of modes
 */
export function getAvailableGoogleMapsModes(): EnumGoogleMapsMode[]
{
	return [
		EnumGoogleMapsMode.Web,
		EnumGoogleMapsMode.WebName,
		EnumGoogleMapsMode.WebCoord,
		EnumGoogleMapsMode.WebCoordName,
		EnumGoogleMapsMode.WebCoordAddress,
		EnumGoogleMapsMode.WebAddressName,
		EnumGoogleMapsMode.WebAuto,
		EnumGoogleMapsMode.App,
	];
}
