/**
 * Google Maps URL 工具
 * Google Maps URL utilities
 *
 * 提供產生 Google Maps URL 的功能，支援 Web URL 和 App Deep Link 兩種模式
 * Provides generating Google Maps URLs, supporting Web URL and App Deep Link modes
 */

import { IGeoCoord } from '@/lib/utils/grid/grid-types';

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
}

/**
 * Google Maps 查詢選項
 * Google Maps query options
 */
export interface IGoogleMapsQueryOptions
{
	/** 場所名稱 / Place name */
	name?: string;
	/** 完整地址 / Full address */
	address?: string;
	/** 座標 / Coordinates */
	coord?: IGeoCoord;
	/** 開啟模式（預設為 Web）/ Opening mode (default: Web) */
	mode?: EnumGoogleMapsMode;
	/** 是否為導航模式 / Navigation mode */
	isNavigation?: boolean;
}

/**
 * 構建查詢字串 - 使用 name/address/coord 優先順序
 * Build query string - uses name/address/coord priority
 *
 * @param coord - 座標 / Coordinates
 * @param name - 名稱 / Name
 * @param address - 地址 / Address
 * @returns 查詢字串 / Query string
 */
const buildGoogleQuery = (coord: IGeoCoord, name?: string, address?: string): string =>
{
	if (name) return `${coord.lat},${coord.lng}+(${encodeURIComponent(name)})`;
	if (address) return `${coord.lat},${coord.lng}+(${encodeURIComponent(address)})`;
	return `${coord.lat},${coord.lng}`;
};

/**
 * 構建 geo: scheme URL
 * Build geo: scheme URL
 */
const buildGeoUrl = (coord: IGeoCoord, name?: string, address?: string, isNavigation = false): string =>
{
	const query = buildGoogleQuery(coord, name, address);
	return isNavigation
		? `geo:${coord.lat},${coord.lng}?q=${query}&mode=n`
		: `geo:${coord.lat},${coord.lng}?q=${query}`;
};

/**
 * 構建網頁搜尋 URL
 * Build web search URL
 */
const buildWebSearchUrl = (query: string): string =>
	`https://www.google.com/maps/search/?api=1&query=${query}`;

/**
 * 構建導航 URL
 * Build navigation URL
 */
const buildNavUrl = (dest: string): string =>
	`https://www.google.com/maps/dir/?api=1&destination=${dest}`;

/**
 * 產生 Google Maps URL - 統一函式
 * Generate Google Maps URL - Unified function
 *
 * @param options - 查詢選項 / Query options
 * @returns Google Maps URL
 * @throws 若無法產生 URL則拋出錯誤 / Throws error if URL cannot be generated
 */
export function generateGoogleMapsUrl(options: IGoogleMapsQueryOptions): string
{
	// 驗證必須，至少要有 coord, name, 或 address 其一
	if (!options.coord && !options.name && !options.address)
	{
		throw new Error('Google Maps URL: 至少需要提供 coord、name 或 address 其中之一');
	}

	const mode = options.mode ?? EnumGoogleMapsMode.Web;
	const isNavigation = options.isNavigation ?? false;
	const { name, address, coord } = options;

	// App 模式使用 geo: scheme
	if (mode === EnumGoogleMapsMode.App && coord)
	{
		return buildGeoUrl(coord, name, address, isNavigation);
	}

	// 導航模式
	if (isNavigation)
	{
		const dest = coord
			? `${coord.lat},${coord.lng}`
			: address
				? encodeURIComponent(address)
				: '';
		if (!dest) throw new Error('Google Maps URL: 導航模式需要提供座標或地址');
		return buildNavUrl(dest);
	}

	// Web 模式處理
	switch (mode)
	{
		case EnumGoogleMapsMode.WebName:
			return name ? buildWebSearchUrl(encodeURIComponent(name)) : '';

		case EnumGoogleMapsMode.WebCoord:
			return coord ? buildWebSearchUrl(`${coord.lat},${coord.lng}`) : '';

		case EnumGoogleMapsMode.WebCoordName:
			return coord && name
				? buildWebSearchUrl(`${coord.lat},${coord.lng}+(${encodeURIComponent(name)})`)
				: name
					? buildWebSearchUrl(encodeURIComponent(name))
					: '';

		case EnumGoogleMapsMode.WebCoordAddress:
			return coord && address
				? buildWebSearchUrl(`${coord.lat},${coord.lng}+(${encodeURIComponent(address)})`)
				: address
					? buildWebSearchUrl(encodeURIComponent(address))
					: '';

		case EnumGoogleMapsMode.WebAddressName:
			return address && name
				? buildWebSearchUrl(`${encodeURIComponent(address)}+(${encodeURIComponent(name)})`)
				: address
					? buildWebSearchUrl(encodeURIComponent(address))
					: name
						? buildWebSearchUrl(encodeURIComponent(name))
						: '';

		case EnumGoogleMapsMode.Web:
		default:
			// 預設：使用優先順序 name > address > coord
			if (coord)
			{
				const query = name
					? `${coord.lat},${coord.lng}+(${encodeURIComponent(name)})`
					: address
						? `${coord.lat},${coord.lng}+(${encodeURIComponent(address)})`
						: `${coord.lat},${coord.lng}`;
				return buildWebSearchUrl(query);
			}
			if (address)
			{
				return buildWebSearchUrl(encodeURIComponent(address));
			}
			if (name)
			{
				return buildWebSearchUrl(encodeURIComponent(name));
			}
			break;
	}

	throw new Error('Google Maps URL: 無法產生 URL');
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
 * 取得顯示名稱
 * Get display name for mode
 *
 * @param mode - 模式 / Mode
 * @returns 顯示名稱 / Display name
 */
export function getGoogleMapsModeDisplayName(mode: EnumGoogleMapsMode): string
{
	switch (mode)
	{
		case EnumGoogleMapsMode.App:
			return 'App (地圖App)';
		case EnumGoogleMapsMode.WebName:
			return '名稱 (Name only)';
		case EnumGoogleMapsMode.WebCoordName:
			return '座標+名稱 (Coord + Name)';
		case EnumGoogleMapsMode.WebAddressName:
			return '地址+名稱 (Address + Name)';
		case EnumGoogleMapsMode.Web:
		default:
			return '座標 (Coordinates)';
	}
}

/**
 * 取得所有可用模式
 * Get all available modes
 *
 * @returns 模式陣列 / Array of modes
 */
export function getAvailableGoogleMapsModes(): EnumGoogleMapsMode[]
{
	return [
		EnumGoogleMapsMode.Web,
		EnumGoogleMapsMode.WebName,
		EnumGoogleMapsMode.WebCoordName,
		EnumGoogleMapsMode.WebAddressName,
		EnumGoogleMapsMode.App,
	];
}
