import { NOMINATIM_CONTACT_EMAIL } from '@/config/nominatim-config';
import { IGpsCoordinate } from '../grid/grid-types';

export async function fetchOSMReverseInfo(coord: IGpsCoordinate, options?: RequestInit)
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
	place_id: number;
	licence: string;
	osm_type: string;
	osm_id: number;
	lat: string;
	lon: string;
	/**
	 * place
	 */
	category: string;
	/**
	 * house
	 */
	type: string;
	/**
	 * 30
	 */
	place_rank: number;
	/**
	 * 0.00007457007705801507
	 */
	importance: number;
	addresstype: string;
	name: string;
	display_name: string;
	address: {
		house_number: string;
		road: string;
		neighbourhood: string;
		suburb: string;
		village: string;
		city: string;
		'ISO3166-2-lvl4': string;
		postcode: string;
		country: string;
		country_code: string
	};
	boundingbox: string[];
}

let a: IReturnOSMReverseInfo = {
    "place_id": 213282069,
    "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
    "osm_type": "node",
    "osm_id": 10907776398,
    "lat": "25.0363383",
    "lon": "121.4929451",
    "category": "place",
    "type": "house",
    "place_rank": 30,
    "importance": 0.00007457007705801507,
    "addresstype": "place",
    "name": "",
    "display_name": "69號, 桂林路244巷, 柳鄉里, 萬華區, 下崁, 臺北市, 108, 臺灣",
    "address": {
        "house_number": "69號",
        "road": "桂林路244巷",
        "neighbourhood": "柳鄉里",
        "suburb": "萬華區",
        "village": "下崁",
        "city": "臺北市",
        "ISO3166-2-lvl4": "TW-TPE",
        "postcode": "108",
        "country": "臺灣",
        "country_code": "tw"
    },
    "boundingbox": [
        "25.0362883",
        "25.0363883",
        "121.4928951",
        "121.4929951"
    ]
}
