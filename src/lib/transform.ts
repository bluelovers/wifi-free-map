/**
 * 資料轉換工具函式庫
 * Data transformation utilities.
 *
 * 提供將原始資料（JSON）轉換為結構化資料的函式。
 * Provides functions to transform raw data (JSON) to structured data.
 */

import { IHotspot, IRawHotspot_iTaiwan, IRawHotspot_TaipeiFree } from "@/types/station-wifi";
import type { IChargingStation, IRawChargingStation } from "@/types/station-charging";
import { ITSGenerator, ITSPickExtra } from 'ts-type';
import { EnumDatasetType, IValueArrayOrIterable } from '@/lib/utils/grid/grid-types';
import { IStationBase } from '@/types/station-base';
import { _fixCoordFromStringCore } from '@/lib/utils/grid/grid-utils-global';
import { GLOBAL_GRID_CONFIG_PRECISION_MAKRER } from '@/lib/utils/grid/grid-const';

// ==================== Wi-Fi 熱點轉換 ====================

/**
 * 將原始 Wi-Fi 熱點資料轉換為標準格式
 * Convert raw Wi-Fi hotspot data to standard format.
 *
 * 注意：Wi-Fi 原始資料使用英文鍵 (Name, Latitude, Longitude, Address)
 * Note: Wi-Fi raw data uses English keys (Name, Latitude, Longitude, Address)
 *
 * @param raw - 原始資料物件
 * @returns 轉換後的 Hotspot 物件
 */
export function convertWiFiRaw_iTaiwan(raw: IRawHotspot_iTaiwan): IHotspot
{
	return {
		dataType: EnumDatasetType.WIFI,
		category: raw.Administration,
		name: raw.Name,
		lat: _fixCoordFromStringCore(raw.Latitude, GLOBAL_GRID_CONFIG_PRECISION_MAKRER) || 0,
		lng: _fixCoordFromStringCore(raw.Longitude, GLOBAL_GRID_CONFIG_PRECISION_MAKRER) || 0,
		address: raw.Address,
	};
}

/**
 * 將台北市資料轉換為與 iTaiwan 相同的欄位格式
 * 台北市 JSON 使用大寫欄位：NAME, LATITUDE, LONGITUDE, ADDR
 */
export function convertWiFiRaw_TaipeiFree_To_iTaiwan(raw: IRawHotspot_TaipeiFree): ITSPickExtra<IRawHotspot_iTaiwan, 'Name' | 'Latitude' | 'Longitude' | 'Address' | 'Administration'>
{
	return {
		Name: raw.NAME,
		Latitude: raw.LATITUDE,
		Longitude: raw.LONGITUDE,
		Address: raw.ADDR,
		Administration: raw.STYPE,
	};
}

export interface IOptionsCreateConvertRawArrayGenerator<T extends IStationBase, R = unknown> extends IOptionsCreateConvertRawOpts<T>
{
	filter?(item: T): boolean;

	returnType?: 'array' | 'generator';
}

export interface IOptionsCreateConvertRawOpts<T extends IStationBase = IStationBase>
{
	cb?(item: { value: T; isValid: boolean }): void;
}

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
	opts.filter ??= validStation;

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
		name: raw["充電站名稱"] ?? "",
		lat: _fixCoordFromStringCore(raw["緯度"], GLOBAL_GRID_CONFIG_PRECISION_MAKRER) || 0,
		lng: _fixCoordFromStringCore(raw["經度"], GLOBAL_GRID_CONFIG_PRECISION_MAKRER) || 0,
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
export function validStation(station: IChargingStation): boolean
{
	return (station.name && (station.lat !== 0 || station.lng !== 0)) as boolean;
}
