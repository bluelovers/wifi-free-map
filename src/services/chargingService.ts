/**
 * 充電站服務 – 從遠端取得資料、快取至 IndexedDB，
 * 並在離線時使用本地 JSON 作為 fallback。
 * Charging‑station service – fetches data, caches in IndexedDB, and falls back to static JSON.
 */

import { openDB, IDBPDatabase } from "idb";
import { ChargingStation, RawChargingStation } from "../types/charging";
import { mapRawToCharging } from "../types/charging";

const DB_NAME = "wifi-free-map-db";
const STORE_NAME = "charging";

async function getDB(): Promise<IDBPDatabase<any>> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * 從遠端 API 取得充電站資料 (Network‑First)。
 * Fetch charging stations with Network‑First strategy.
 */
export async function fetchChargingStations(): Promise<ChargingStation[]> {
  const endpoint = "/api/chargign";
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Network error: ${res.status}`);
    const raw: RawChargingStation[] = await res.json();
    const mapped = raw.map(mapRawToCharging);
    const db = await getDB();
    await db.put(STORE_NAME, mapped, "latest");
    return mapped;
  } catch (e) {
    const db = await getDB();
    const cached = await db.get(STORE_NAME, "latest");
    if (cached) return cached as ChargingStation[];
    const staticRes = await fetch("/data/charging-stations.json");
    if (staticRes.ok) return (await staticRes.json()) as ChargingStation[];
    return [];
  }
}
