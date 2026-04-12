import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { IWiFiHotspot, IChargingStation } from '@/types';

/**
 * WiFi Free Map 資料庫
 * WiFi Free Map database
 */
interface IWiFiFreeMapDB extends DBSchema
{
	/** WiFi 熱點儲存 / WiFi hotspots store */
	hotspots: {
		key: string;
		value: IWiFiHotspot;
		indexes: {
			'by-source': string;
			'by-createdAt': Date;
		};
	};
	/** 充電設施儲存 / Charging stations store */
	chargingStations: {
		key: string;
		value: IChargingStation;
		indexes: {
			'by-type': string;
		};
	};
	/** 快取元資料 / Cache metadata */
	cache: {
		key: string;
		value: {
			key: string;
			timestamp: Date;
			data: unknown;
		};
	};
}

/** 資料庫名稱 / Database name */
const DB_NAME = 'wifi-free-map';
/** 資料庫版本 / Database version */
const DB_VERSION = 1;

/**
 * 開啟資料庫連線
 * Open database connection
 *
 * @returns 資料庫實例
 */
export async function openDatabase(): Promise<IDBPDatabase<IWiFiFreeMapDB>>
{
	return openDB<IWiFiFreeMapDB>(DB_NAME, DB_VERSION, {
		upgrade(db)
		{
			// 建立 WiFi 熱點儲存
			if (!db.objectStoreNames.contains('hotspots'))
			{
				const hotspotStore = db.createObjectStore('hotspots', {
					keyPath: 'id',
				});
				hotspotStore.createIndex('by-source', 'source');
				hotspotStore.createIndex('by-createdAt', 'createdAt');
			}

			// 建立充電設施儲存
			if (!db.objectStoreNames.contains('chargingStations'))
			{
				const chargingStore = db.createObjectStore('chargingStations', {
					keyPath: 'id',
				});
				chargingStore.createIndex('by-type', 'type');
			}

			// 建立快取儲存
			if (!db.objectStoreNames.contains('cache'))
			{
				db.createObjectStore('cache', {
					keyPath: 'key',
				});
			}
		},
	});
}

/**
 * 新增或更新 WiFi 熱點
 * Add or update WiFi hotspot
 *
 * @param hotspot - WiFi 熱點
 */
export async function saveHotspot(hotspot: IWiFiHotspot): Promise<void>
{
	const db = await openDatabase();
	await db.put('hotspots', hotspot);
}

/**
 * 取得所有 WiFi 熱點
 * Get all WiFi hotspots
 *
 * @returns WiFi 熱點陣列
 */
export async function getAllHotspots(): Promise<IWiFiHotspot[]>
{
	const db = await openDatabase();
	return db.getAll('hotspots');
}

/**
 * 根據來源取得 WiFi 熱點
 * Get WiFi hotspots by source
 *
 * @param source - 資料來源
 * @returns WiFi 熱點陣列
 */
export async function getHotspotsBySource(
	source: 'itaiwan' | 'user_contributed',
): Promise<IWiFiHotspot[]>
{
	const db = await openDatabase();
	return db.getAllFromIndex('hotspots', 'by-source', source);
}

/**
 * 新增或更新充電設施
 * Add or update charging station
 *
 * @param station - 充電設施
 */
export async function saveChargingStation(station: IChargingStation): Promise<void>
{
	const db = await openDatabase();
	await db.put('chargingStations', station);
}

/**
 * 取得所有充電設施
 * Get all charging stations
 *
 * @returns 充電設施陣列
 */
export async function getAllChargingStations(): Promise<IChargingStation[]>
{
	const db = await openDatabase();
	return db.getAll('chargingStations');
}

/**
 * 儲存快取資料
 * Save cache data
 *
 * @param key - 快取鍵
 * @param data - 快取資料
 */
export async function saveCache(key: string, data: unknown): Promise<void>
{
	const db = await openDatabase();
	await db.put('cache', {
		key,
		timestamp: new Date(),
		data,
	});
}

/**
 * 取得快取資料
 * Get cached data
 *
 * @param key - 快取鍵
 * @param maxAgeMs - 最大有效時間（毫秒），預設 24 小時
 * @returns 快取資料，若過期或不存在則回傳 null
 */
export async function getCache<T>(
	key: string,
	maxAgeMs: number = 24 * 60 * 60 * 1000,
): Promise<T | null>
{
	const db = await openDatabase();
	const cached = await db.get('cache', key);

	if (!cached)
	{
		return null;
	}

	const age = Date.now() - cached.timestamp.getTime();
	if (age > maxAgeMs)
	{
		return null;
	}

	return cached.data as T;
}

/**
 * 清除所有資料
 * Clear all data
 */
export async function clearAllData(): Promise<void>
{
	const db = await openDatabase();
	await db.clear('hotspots');
	await db.clear('chargingStations');
	await db.clear('cache');
}
