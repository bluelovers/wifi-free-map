/**
 * 靜態資料載入工具 – 用於在前端讀取已同步至 /public/data/ 的 JSON 檔案。
 * Static data loader – reads JSON files under /public/data/ for the front‑end.
 */

/**
 * 取得 Wi‑Fi 熱點（過濾後）
 * Get filtered Wi‑Fi hotspots.
 */
export async function loadHotspots()
{
	const res = await fetch("/data/wifi-hotspots.json");
	if (!res.ok) throw new Error(`Failed to load hotspots: ${res.status}`);
	return (await res.json()) as any[];
}

/**
 * 取得 Wi‑Fi 熱點（完整原始）
 * Get raw Wi‑Fi hotspots.
 */
export async function loadHotspotsRaw()
{
	const res = await fetch("/data/wifi-hotspots-raw.json");
	if (!res.ok) throw new Error(`Failed to load raw hotspots: ${res.status}`);
	return (await res.json()) as any[];
}

/**
 * 取得充電站（過濾後）
 * Get filtered charging stations.
 */
export async function loadChargingStations()
{
	const res = await fetch("/data/charging-stations.json");
	if (!res.ok) throw new Error(`Failed to load charging stations: ${res.status}`);
	return (await res.json()) as any[];
}

/**
 * 取得充電站（完整原始）
 * Get raw charging stations.
 */
export async function loadChargingStationsRaw()
{
	const res = await fetch("/data/charging-stations-raw.json");
	if (!res.ok) throw new Error(`Failed to load raw charging stations: ${res.status}`);
	return (await res.json()) as any[];
}
