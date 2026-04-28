/**
 * 資料轉換工具函式庫
 * Data transformation utilities.
 *
 * 提供將原始資料（JSON）轉換為結構化資料的函式。
 * Provides functions to transform raw data (JSON) to structured data.
 *
 * 主要功能包括：
 * - 將 iTaiwan/TaipeiFree 格式的 WiFi 熱點資料轉換為標準格式
 * - 將充電站原始資料轉換為標準格式
 * - 提供陣列和生成器兩種轉換模式
 */
import { IHotspot, IHotspot_auth, IRawHotspot_iTaiwan, IRawHotspot_TaipeiFree } from "@/types/station-wifi";
import type { IChargingStation, IRawChargingStation } from "@/types/station-charging";
import { ITSGenerator, ITSPickExtra } from 'ts-type';
import { EnumDatasetSource, EnumDatasetType, EnumWifiAuthType, EnumWifiSSIDName, IValueArrayOrIterable } from '@/lib/utils/grid/grid-types';
import { IStationBase } from '@/types/station-base';
import { GLOBAL_GRID_CONFIG_PRECISION_MAKRER } from '@/lib/utils/grid/grid-const';
import { _normalizeCoordScalarFromStringNumberCore } from '@/lib/utils/geo/geo-transform';

// ==================== Wi-Fi 熱點轉換 / Wi-Fi Hotspot Conversion ====================

/**
 * 將 iTaiwan Wi-Fi 熱點資料轉換為標準格式
 * Convert iTaiwan Wi-Fi hotspot data to standard format
 *
 * 將 iTaiwan 資料集的原始欄位（Name, Latitude, Longitude, Address）轉換為 IHotspot 介面格式
 * Transforms raw iTaiwan fields (Name, Latitude, Longitude, Address) to IHotspot interface format
 *
 * @param raw - iTaiwan 原始資料物件 / iTaiwan raw data object
 * @returns 轉換後的 IHotspot 物件 / Converted IHotspot object
 */
export function convertWiFiRaw_iTaiwan(raw: IRawHotspot_iTaiwan & IHotspot_auth): IHotspot
{
	return {
		dataType: EnumDatasetType.WIFI,
		dataSource: raw.dataSource,
		category: raw.Administration,
		name: raw.Name,
		lat: _normalizeCoordScalarFromStringNumberCore(raw.Latitude, GLOBAL_GRID_CONFIG_PRECISION_MAKRER) || 0,
		lng: _normalizeCoordScalarFromStringNumberCore(raw.Longitude, GLOBAL_GRID_CONFIG_PRECISION_MAKRER) || 0,
		address: raw.Address,

		ssid: raw.ssid,
		password: raw.password,
		authType: raw.authType,
	};
}

/**
 * 將台北市 Free Wi-Fi 資料轉換為 iTaiwan 格式
 * Convert Taipei Free Wi-Fi data to iTaiwan format
 *
 * 台北市資料使用大寫欄位名稱 (NAME, LATITUDE, LONGITUDE, ADDR)
 * 轉換為 iTaiwan 標準格式以便統一處理
 * Taipei dataset uses uppercase field names; converts to iTaiwan format for unified processing
 *
 * @param raw - 台北市原始資料 / Taipei raw data
 * @returns iTaiwan 格式的資料 / Data in iTaiwan format
 */
export function convertWiFiRaw_TaipeiFree_To_iTaiwan(raw: IRawHotspot_TaipeiFree): ITSPickExtra<IRawHotspot_iTaiwan, 'Name' | 'Latitude' | 'Longitude' | 'Address' | 'Administration'>
{
	return {
		Name: raw.NAME,
		Latitude: raw.LATITUDE,
		Longitude: raw.LONGITUDE,
		Address: raw.ADDR,
		Administration: raw.STYPE,

		ssid: raw.SSID,
		password: raw.PASSWORD,
		authType: raw.AUTH_TYPE as EnumWifiAuthType,
	};
}

export function _normalizeWifiSSID(raw: IRawHotspot_iTaiwan, ssid: EnumWifiSSIDName): IRawHotspot_iTaiwan & IHotspot_auth
{
	if (!raw.ssid && ssid)
	{
		raw.ssid = ssid;
	}

	switch (raw.ssid)
	{
		case EnumWifiSSIDName.TAIPEI_FREE_WIFI:
		case EnumWifiSSIDName.ITAIWAN:
			raw.authType = EnumWifiAuthType.PORTAL;

			raw.dataSource = EnumDatasetSource.GOV_DATA;

			break;
	}

	return raw;
}

/**
 * 轉換選項介面 - 包含過濾器和回調
 * Conversion options interface - includes filter and callback

 * @typeParam T - 目標類型 / Target type
 * @typeParam R - 來源類型 / Source type
 */
export interface IOptionsCreateConvertRawArrayGenerator<T extends IStationBase, R = unknown> extends IOptionsCreateConvertRawOpts<T>
{
	/** 過濾函式 / Filter function */
	filter?(item: T): boolean;

	/** 回傳類型：陣列或生成器 / Return type: array or generator */
	returnType?: 'array' | 'generator';
}

/**
 * 轉換基本選項介面
 * Conversion basic options interface
 *
 * @typeParam T - 設施類型 / Facility type
 */
export interface IOptionsCreateConvertRawOpts<T extends IStationBase = IStationBase>
{
	/** 轉換後的回調函式 / Callback function after conversion */
	cb?(item: { value: T; isValid: boolean }): void;
}

/**
 * 建立轉換生成器或陣列的工廠函式
 * Factory function for creating converter that returns generator or array
 *
 * 根據 returnType 選項建立不同的轉換函式
 * Creates different converter functions based on returnType option
 *
 * @param fn - 轉換函式 / Converter function
 * @param opts - 選項 / Options
 * @returns 轉換後的函式 / Converted function
 */
export function _createConvertRawArrayGenerator<R, T extends IStationBase>(fn: (raw: R) => T,
	opts: IOptionsCreateConvertRawArrayGenerator<T, R> & { returnType: 'generator' },
): (rawData: IValueArrayOrIterable<R>, opts2?: IOptionsCreateConvertRawOpts<T>) => ITSGenerator<T>
export function _createConvertRawArrayGenerator<R, T extends IStationBase>(fn: (raw: R) => T,
	opts?: IOptionsCreateConvertRawArrayGenerator<T, R> & { returnType: 'array' },
): (rawData: IValueArrayOrIterable<R>, opts2?: IOptionsCreateConvertRawOpts<T>) => T[]
export function _createConvertRawArrayGenerator<R, T extends IStationBase>(fn: (raw: R) => T,
	opts?: IOptionsCreateConvertRawArrayGenerator<T, R>,
): (rawData: IValueArrayOrIterable<R>, opts2?: IOptionsCreateConvertRawOpts<T>) => T[]
export function _createConvertRawArrayGenerator<R, T extends IStationBase>(fn: (raw: R) => T,
	opts?: IOptionsCreateConvertRawArrayGenerator<T, R>,
)
{
	opts ??= {};
	opts.filter ??= validStation as any;

	const handler = (rawData: R, opts2?: IOptionsCreateConvertRawOpts<T>) =>
	{
		const value = fn(rawData);
		const isValid = opts!.filter!(value);

		const item = {
			value,
			isValid,
		};

		opts!.cb?.(item);
		opts2?.cb?.(item);

		return item
	};

	if (opts.returnType !== 'generator')
	{
		return function (rawData: IValueArrayOrIterable<R>, opts2?: IOptionsCreateConvertRawOpts<T>): T[]
		{
			let result: T[] = [];

			for (const raw of rawData)
			{
				const item = handler(raw, opts2);
				if (item.isValid)
				{
					result.push(item.value);
				}
			}

			return result;
		};
	}

	return function* (rawData: IValueArrayOrIterable<R>, opts2?: IOptionsCreateConvertRawOpts<T>): ITSGenerator<T>
	{
		for (const raw of rawData)
		{
			const item = handler(raw, opts2);
			if (item.isValid)
			{
				yield item.value;
			}
		}
		return undefined as any
	};
}

/**
 * 將原始 Wi-Fi 熱點資料陣列轉換為 Hotspot 陣列
 * Convert array of raw Wi-Fi hotspot data to Hotspot array.
 *
 * @param rawData - 原始資料陣列
 * @returns 轉換後的 Hotspot 陣列
 */
export const convertWiFiArray = _createConvertRawArrayGenerator(convertWiFiRaw_iTaiwan, {
	returnType: 'array',
});

export const convertWiFiArrayGenerator = _createConvertRawArrayGenerator(convertWiFiRaw_iTaiwan, {
	returnType: 'generator',
});

// ==================== 充電站轉換 ====================

/**
 * 將原始充電站資料轉換為標準格式
 * Convert raw charging station data to standard format.
 *
 * 注意：充電站原始資料使用中文鍵 (充電站名稱, 緯度, 經度, 地址)
 * Note: Charging raw data uses Chinese keys (充電站名稱, 緯度, 經度, 地址)
 *
 * @param raw - 原始資料物件
 * @returns 轉換後的 ChargingStation 物件
 */
export function convertChargingRaw(raw: IRawChargingStation): IChargingStation
{
	return {
		dataType: EnumDatasetType.CHARGING,
		dataSource: EnumDatasetSource.GOV_DATA,
		name: raw["充電站名稱"] ?? "",
		lat: _normalizeCoordScalarFromStringNumberCore(raw["緯度"], GLOBAL_GRID_CONFIG_PRECISION_MAKRER) || 0,
		lng: _normalizeCoordScalarFromStringNumberCore(raw["經度"], GLOBAL_GRID_CONFIG_PRECISION_MAKRER) || 0,
		address: raw["地址"] ?? "",
	};
}

/**
 * 將原始充電站資料陣列轉換為 ChargingStation 陣列
 * Convert array of raw charging station data to ChargingStation array.
 *
 * @param rawData - 原始資料陣列
 * @returns 轉換後的 ChargingStation 陣列
 */
export const convertChargingArray = _createConvertRawArrayGenerator(convertChargingRaw, {
	returnType: 'array',
});

export const convertChargingArrayGenerator = _createConvertRawArrayGenerator(convertChargingRaw, {
	returnType: 'generator',
});

/**
 * 驗證充電站資料是否有效
 * Validate if charging station data is valid.
 *
 * @param station - 充電站物件
 * @returns 是否有效
 */
export function validStation(station: IStationBase): boolean
{
	return (station.name && (station.lat !== 0 || station.lng !== 0)) as boolean;
}
