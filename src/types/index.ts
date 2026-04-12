/**
 * 設施類型列舉
 * Facility type enumeration
 */
export enum EnumFacilityType
{
	WiFi = 'wifi',
	USB = 'usb',
	Outlet = 'outlet',
	Wireless = 'wireless',
	EV = 'ev',
}

/**
 * WiFi 熱點介面
 * WiFi hotspot interface
 */
export interface IWiFiHotspot
{
	/** 唯一識別碼 / Unique identifier */
	id: string;
	/** 資料來源 / Data source */
	source: 'itaiwan' | 'user_contributed';
	/** 地點名稱 / Location name */
	name: string;
	/** WiFi SSID / WiFi SSID */
	ssid: string;
	/** WiFi 密碼（可選） / WiFi password (optional) */
	password?: string;
	/** 地理位置 / Geographic location */
	location: {
		/** 緯度 / Latitude */
		lat: number;
		/** 經度 / Longitude */
		lng: number;
		/** 地址 / Address */
		address: string;
	};
	/** 提供者 / Provider */
	provider: string;
	/** 是否免費 / Whether it is free */
	isFree: boolean;
	/** 是否開放中 / Whether it is open */
	isOpen: boolean;
	/** 開放時間（可選） / Opening hours (optional) */
	openTime?: string;
	/** 建立時間 / Creation timestamp */
	createdAt: Date;
	/** 建立者 / Created by */
	createdBy: string;
	/** 是否經過驗證 / Whether verified */
	verified: boolean;
}

/**
 * 充電設施介面
 * Charging station interface
 */
export interface IChargingStation
{
	/** 唯一識別碼 / Unique identifier */
	id: string;
	/** 資料來源 / Data source */
	source: 'osm' | 'ev_api' | 'user_contributed';
	/** 設施類型 / Facility type */
	type: EnumFacilityType;
	/** 地理位置 / Geographic location */
	location: {
		/** 緯度 / Latitude */
		lat: number;
		/** 經度 / Longitude */
		lng: number;
		/** 地址 / Address */
		address: string;
	};
	/** 設施名稱 / Facility name */
	name: string;
	/** 詳細資訊（可選） / Details (optional) */
	details?: string;
	/** 支援的插座類型 / Supported socket types */
	socketTypes?: string[];
	/** 是否免費 / Whether it is free */
	isFree: boolean;
	/** 營業時間（可選） / Opening hours (optional) */
	openingHours?: string;
}
