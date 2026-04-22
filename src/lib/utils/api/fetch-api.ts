/**
 * 取得 OpenStreetMap 反向地理編碼資訊
 * Get OSM reverse geocoding information
 *
 * 透過 Nominatim API 取得座標對應的地址資訊
 * Retrieves address information from coordinates via Nominatim API
 *
 * @param coord - GPS 座標 / GPS coordinates
 * @param options -fetch 選項（可選）/ Fetch options (optional)
 * @returns 包含地址資訊的物件 / Object with address information
 */
import { NOMINATIM_CONTACT_EMAIL } from '@/config/nominatim-config';
import { IGeoCoord } from '../grid/grid-types';

export async function fetchOSMReverseInfo(coord: IGeoCoord, options?: RequestInit)
{
	options = {
		...options,
		headers: {
			'User-Agent': `WiFi-Free-Map/1.0 (${NOMINATIM_CONTACT_EMAIL})`,
			...options?.headers,
		},
	};

	return fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coord.lat}&lon=${coord.lng}`, options)
		.then(res => res.json())
		.then(data => {
			console.log('fetchOSMReverseInfo', coord, data);
			return data as IReturnOSMReverseInfo;
		})
		;
}

/**
 * Nominatim 反向地理編碼回傳介面
 * Nominatim reverse geocoding response interface
 *
 * 描述 Nominatim API 回傳的地址資訊結構
 * Describes the address information structure returned by Nominatim API
 *
 * https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coord.lat}&lon=${coord.lng}
 *
 * @example
 * ```json
 * {
 *     "place_id": 213282069,
 *     "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
 *     "osm_type": "node",
 *     "osm_id": 10907776398,
 *     "lat": "25.0363383",
 *     "lon": "121.4929451",
 *     "category": "place",
 *     "type": "house",
 *     "place_rank": 30,
 *     "importance": 0.00007457007705801507,
 *     "addresstype": "place",
 *     "name": "",
 *     "display_name": "69號, 桂林路244巷, 柳鄉里, 萬華區, 下崁, 臺北市, 108, 臺灣",
 *     "address": {
 *         "house_number": "69號",
 *         "road": "桂林路244巷",
 *         "neighbourhood": "柳鄉里",
 *         "suburb": "萬華區",
 *         "village": "下崁",
 *         "city": "臺北市",
 *         "ISO3166-2-lvl4": "TW-TPE",
 *         "postcode": "108",
 *         "country": "臺灣",
 *         "country_code": "tw"
 *     },
 *     "boundingbox": [
 *         "25.0362883",
 *         "25.0363883",
 *         "121.4928951",
 *         "121.4929951"
 *     ]
 * }
 * ```
 */
export interface IReturnOSMReverseInfo
{
	/** 地點 ID / Place ID */
	place_id: number;
	/** 授權資訊 / License information */
	licence: string;
	/** OSM 類型 / OSM type */
	osm_type: string;
	/** OSM ID / OSM ID */
	osm_id: number;
	/** 緯度 / Latitude */
	lat: string;
	/** 經度 / Longitude */
	lon: string;
	/** 類別（如 place）/ Category (e.g., place) */
	category: string;
	/** 類型（如 house）/ Type (e.g., house) */
	type: string;
	/**
	 * 地點排名 / Place rank
	 * 30
	 */
	place_rank: number;
	/**
	 * 重要性分數 / Importance score
	 * 0.00007457007705801507
	 */
	importance: number;
	/** 地址類型 / Address type */
	addresstype: string;
	/** 名稱 / Name */
	name: string;
	/** 顯示名稱（完整地址）/ Display name (full address) */
	display_name: string;
	/** 地址元件 / Address components */
	address: {
		/** 門牌號碼 / House number */
		house_number: string;
		/** 路名 / Road */
		road: string;
		/** 鄰里 / Neighbourhood */
		neighbourhood: string;
		/** 行政區 / Suburb */
		suburb: string;
		/** 村里 / Village */
		village: string;
		/** 城市 / City */
		city: string;
		/** ISO3166-2 代碼 / ISO3166-2 code */
		'ISO3166-2-lvl4': string;
		/** 郵遞區號 / Postcode */
		postcode: string;
		/** 國家 / Country */
		country: string;
		/** 國家代碼 / Country code */
		country_code: string
	};
	/** 邊界框 / Bounding box */
	boundingbox: string[];
}
