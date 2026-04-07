import { NextResponse } from "next/server";
import { fetchChargingStations } from "../../../services/chargingService";
import { ChargingStation } from "../../../types/charging";

/**
 * GET /api/charging – 取得充電站資料。
 * Network‑First strategy via chargingService, with mock fallback.
 */
export async function GET() {
  try {
    const data: ChargingStation[] = await fetchChargingStations();
    return NextResponse.json(data);
  } catch (e) {
    // 若服務失敗，使用本地 mock（空陣列）
    return NextResponse.json([]);
  }
}
