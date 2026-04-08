/**
 * Wi‑Fi 熱點服務 – 負責從遠端取得資料、快取至 IndexedDB，
 * 並在離線時使用本地 JSON 作為 fallback。
 * Hotspot service – fetches data, caches in IndexedDB, and falls back to static JSON.
 */

import { openDB, IDBPDatabase } from "idb";
import { Hotspot, RawHotspot } from "../types/hotspot";
import { convertWiFiRaw } from "../lib/transform";

/**
 * IndexedDB 資料庫名稱與物件存儲空間
 * DB name and store.
 */
const DB_NAME = "wifi-free-map-db";
const STORE_NAME = "hotspots";

/**
 * 建立或取得 IndexedDB 連線
 * Create or get the IndexedDB connection.
 */
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
 * 從遠端 API 取得 Wi‑Fi 熱點 (Network‑First)。
 * Fetch Wi‑Fi hotspots with Network‑First strategy.
 */
export async function fetchHotspots(): Promise<Hotspot[]> {
  const endpoint = "https://itaiwan.gov.tw/ITaiwanDW/GetFile?fileName=IpSelect_tw.json&type=6"; // iTaiwan Wi‑Fi API endpoint (Dataset 5962)
  try {
  const db = await getDB();
  // 嘗試從快取取得，若快取在 24 小時內仍有效則直接回傳
  const cachedEntry = await db.get(STORE_NAME, "latest");
  if (cachedEntry && cachedEntry.timestamp && (Date.now() - cachedEntry.timestamp) < 24 * 60 * 60 * 1000) {
    // cache still fresh
    return cachedEntry.data as Hotspot[];
  }
  // 若快取不存在或已過期，向遠端取得
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  const raw: RawHotspot[] = await res.json();
  const mapped = raw.map(convertWiFiRaw);
  // Store fresh data 與時間戳於 IndexedDB
  await db.put(STORE_NAME, { timestamp: Date.now(), data: mapped }, "latest");
  return mapped;
  } catch (e) {
    // On failure, try IndexedDB then static JSON fallback
    const db = await getDB();
    const cached = await db.get(STORE_NAME, "latest");
    if (cached) return cached as Hotspot[];
    // fallback to static JSON
    const staticRes = await fetch("/data/wifi-hotspots.json");
    if (staticRes.ok) return (await staticRes.json()) as Hotspot[];
    // final mock fallback
    return [];
  }
}
