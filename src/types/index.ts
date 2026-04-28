import { IHotspot } from '@/types/station-wifi';
import { IChargingStation as IChargingStationBase } from '@/types/station-charging';
import { EnumDatasetType, IGpsLngLatMinMax, IMatchedBuckets } from '@/lib/utils/grid/grid-types';

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
 *
 * 繼承 IHotspot 並添加前端所需的額外欄位
 * Extends IHotspot with additional fields for front-end
 */
export interface IWiFiHotspot extends IHotspot, IWiFiHotspot_not_impl
{
	
}

/**
 * 未實裝的屬性
 */
export interface IWiFiHotspot_not_impl
{
	/** 提供者 / Provider */
	provider?: string;
	/** 是否免費 / Whether it is free */
	isFree?: boolean;
	/** 是否開放中 / Whether it is open */
	isOpen?: boolean;
	/** 開放時間（可選） / Opening hours (optional) */
	openTime?: string;
	/** 建立時間 / Creation timestamp */
	createdAt?: Date;
	/** 建立者 / Created by */
	createdBy?: string;
	/** 是否經過驗證 / Whether verified */
	verified?: boolean;
}

/**
 * 充電設施介面
 * Charging station interface
 *
 * 繼承 IChargingStationBase 並添加前端所需的額外欄位
 * Extends IChargingStationBase with additional fields for front-end
 */
export interface IChargingStationMarker extends IChargingStationBase
{
	/** 唯一識別碼 / Unique identifier */
	id: string;
	/** 資料來源 / Data source */
	source: 'osm' | 'ev_api' | 'user_contributed';
	/** 詳細資訊（可選） / Details (optional) */
	details?: string;
	/** 支援的插座類型 / Supported socket types */
	socketTypes?: string[];
	/** 是否免費 / Whether it is free */
	isFree: boolean;
	/** 營業時間（可選） / Opening hours (optional) */
	openingHours?: string;
}

export interface IApiReturnWifi
{
	success: boolean;
	data: IWiFiHotspot[];
	bucket: { lng: number; lat: number; indexPath: string; activeBlocks: number };
	block: { lng: number; lat: number; dataPath: string; dataCount: number };
}

export interface IApiReturnError
{
	success: false;
	error: string;
}

export interface IApiReturnCharging
{
	success: boolean;
	data: IChargingStationMarker[];
	block: { lng: number; lat: number; path: string; count: number };
}

/**
 * API 回傳格式
 * API response format
 */
export interface IApiReturnBlocksBatch
{
	success: boolean;
	data: {
		[EnumDatasetType.WIFI]: IWiFiHotspot[];
		[EnumDatasetType.CHARGING]: IChargingStationMarker[];
	};
	matchedBuckets: IMatchedBuckets;
	matchedRange: IGpsLngLatMinMax;
}
