import { NextResponse } from "next/server";
import { fetchHotspots } from "../../../services/hotspotService";
import { IHotspot } from "../../../types/station-wifi";

/**
 * GET /api/hotspots – 取得 Wi‑Fi 熱點資料。
 * Network‑First strategy via hotspotService, with mock fallback.
 */
export async function GET()
{
	try
	{
		const data: IHotspot[] = await fetchHotspots();
		return NextResponse.json(data);
	}
	catch (e)
	{
		// 若服務失敗，使用本地 mock（空陣列）
		return NextResponse.json([]);
	}
}
