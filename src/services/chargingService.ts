/**
 * 充電站服務 – 從遠端取得資料、快取至 IndexedDB，
 * 並在離線時使用本地 JSON 作為 fallback。
 * Charging‑station service – fetches data, caches in IndexedDB, and falls back to static JSON.
 */

import { openDB, IDBPDatabase } from "idb";
import { IChargingStation, IRawChargingStation } from "../types/station-charging";
import { convertChargingRaw } from "../lib/transform";

const DB_NAME = "wifi-free-map-db";
const STORE_NAME = "charging";

async function getDB(): Promise<IDBPDatabase<any>>
{
	return openDB(DB_NAME, 1, {
		upgrade(db)
		{
			if (!db.objectStoreNames.contains(STORE_NAME))
			{
				db.createObjectStore(STORE_NAME);
			}
		},
	});
}

/**
 * 從遠端 API 取得充電站資料 (Network‑First)。
 * Fetch charging stations with Network‑First strategy.
 */
export async function fetchChargingStations(): Promise<IChargingStation[]>
{
	const endpoint = "https://quality.data.gov.tw/dq_download_json.php?nid=28592&md5_url=d474a70fdd9953547d06abe56f60778e"; // iTaiwan charging‑station API endpoint (Dataset 28592)
	try
	{
		const db = await getDB();
		// 嘗試從快取取得，若快取在 24 小時內仍有效則直接回傳
		const cachedEntry = await db.get(STORE_NAME, "latest");
		if (cachedEntry && cachedEntry.timestamp && (Date.now() - cachedEntry.timestamp) < 24 * 60 * 60 * 1000)
		{
			return cachedEntry.data as IChargingStation[];
		}
		// 若快取不存在或已過期，向遠端取得
		const res = await fetch(endpoint);
		if (!res.ok) throw new Error(`Network error: ${res.status}`);
		const raw: IRawChargingStation[] = await res.json();
		const mapped = raw.map(convertChargingRaw);
		// Store fresh data 與時間戳於 IndexedDB
		await db.put(STORE_NAME, { timestamp: Date.now(), data: mapped }, "latest");
		return mapped;
	}
	catch (e)
	{
		const db = await getDB();
		const cached = await db.get(STORE_NAME, "latest");
		if (cached) return cached as IChargingStation[];
		const staticRes = await fetch("/data/charging-stations.json");
		if (staticRes.ok) return (await staticRes.json()) as IChargingStation[];
		return [];
	}
}
