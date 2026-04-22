/**
 * [地理精度小知識]
 * -------------------------------------------------------------------------
 * 1. 球面模型 (Haversine):
 * - 假設地球為圓球。
 * - 優點: 計算極快。
 * - 精度: 誤差約 0.3%~0.5%。
 * 2. 橢球體模型 (Vincenty):
 * - 考慮地球扁平率 (f ≈ 1/298.26)。
 * - 優點: 極度精確 (誤差 < 0.001%)。
 * - 精度: 適用於長距離飛航導航或精確邊界判定。
 * -------------------------------------------------------------------------
 * * 本專案網格系統統一採用 Haversine 以兼顧效能與開發直覺。
 */
import { IGeoCoord } from '@/lib/utils/grid/grid-types';
import { EARTH_MEAN_RADIUS, EARTH_WGS84_EQUATORIAL_RADIUS } from '@/lib/utils/grid/grid-const';

/**
 * 計算兩點之間的球面大圓距離 (Haversine Formula)
 *
 * 計算兩點之間的直線距離
 * 使用 Haversine 公式計算地球表面兩點間的距離
 *
 * Calculate straight-line distance between two coordinates
 * Uses Haversine formula to calculate distance on Earth's surface
 *
 * @remarks
 * 此函數假設地球為一【完美球體】，並使用平均半徑 (6,371km) 進行計算。
 * * 【精度說明】
 * - 適用場景：一般導航、附近點位篩選、UI 顯示距離。
 * - 誤差範圍：全球平均誤差約 0.3%~0.5%。在台灣等中低緯度地區表現穩定。
 * - 優點：計算速度極快，適合處理大量點位排序。
 *
 * @param coordFrom - 起點座標 `{lng, lat}` / Starting coordinates
 * @param coordTo - 終點座標 `{lng, lat}` / Destination coordinates
 * @returns 距離（公尺）/ Distance (in meters)
 */
export function calculateDistance(coordFrom: IGeoCoord, coordTo: IGeoCoord): number
{
	const φ1 = degToRad(coordFrom.lat);
	const φ2 = degToRad(coordTo.lat);
	const ΔφdLat = degToRad(coordTo.lat - coordFrom.lat);
	const ΔλdLng = degToRad(coordTo.lng - coordFrom.lng);

	const a =
		Math.sin(ΔφdLat / 2) * Math.sin(ΔφdLat / 2) +
		Math.cos(φ1) *
		Math.cos(φ2) *
		Math.sin(ΔλdLng / 2) *
		Math.sin(ΔλdLng / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_MEAN_RADIUS * c; // 距離（公尺）
}

/**
 * 計算兩點之間的球面大圓距離 (WGS84 赤道半徑版)
 *
 * 座標參數的順序不影響計算結果
 *
 * @remarks
 * 使用 WGS84 赤道半徑 (6,378,137m)。
 * 【開發者提醒】
 * 此版本計算結果會較標準平均半徑版偏大約 0.11%。
 * 選擇此版本的主要目的是為了與 WGS84 座標轉換常數保持一致，
 * 適合用於需要高度統一常數的網格索引系統。
 *
 * @remarks
 * 使用 WGS84 座標系統定義的赤道長半軸 (6,378,137m) 作為計算基準。
 * 【適用場景】
 * - 當系統內部其他運算（如投影轉換）高度依賴 WGS84 常數時，為了保持常數一致性使用。
 * - 位於赤道附近的區域運算時，精確度會高於平均半徑版。
 * 【差異解析】
 * - 相較於標準版，此版本計算出的結果會「偏大」約 0.11%。
 * - 雖然使用了橢球體半徑，但算法本質仍是球面幾何，並非精確的橢球體大地線導航 (Vincenty's formulae)。
 *
 * @param coordFrom - 起點座標 `{lng, lat}` / Starting coordinates
 * @param coordTo - 終點座標 `{lng, lat}` / Destination coordinates
 * @returns 距離（公尺）/ Distance (in meters)
 */
export function calculateDistanceV2(coordFrom: IGeoCoord, coordTo: IGeoCoord): number
{
	const ΔφdLat = degToRad(coordTo.lat - coordFrom.lat);
	const ΔλdLng = degToRad(coordTo.lng - coordFrom.lng);

	const a =
		Math.sin(ΔφdLat / 2) * Math.sin(ΔφdLat / 2) +
		Math.cos(degToRad(coordFrom.lat)) *
		Math.cos(degToRad(coordTo.lat)) *
		Math.sin(ΔλdLng / 2) *
		Math.sin(ΔλdLng / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_WGS84_EQUATORIAL_RADIUS * c;
}

/**
 * 計算方位角 (Bearing)
 * 從點 A 看向點 B 的角度，0° 為正北，順時針旋轉
 */
export function getBearing(coordFrom: IGeoCoord, coordTo: IGeoCoord): number
{
	const startLat = degToRad(coordFrom.lat);
	const startLng = degToRad(coordFrom.lng);
	const endLat = degToRad(coordTo.lat);
	const endLng = degToRad(coordTo.lng);

	const y = Math.sin(endLng - startLng) * Math.cos(endLat);
	const x =
		Math.cos(startLat) * Math.sin(endLat) -
		Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

	return (radToDeg(Math.atan2(y, x)) + 360) % 360;
}

/** 度轉弧度 */
export function degToRad(deg: number): number
{
	return (deg * Math.PI) / 180;
}

/** 弧度轉度 */
export function radToDeg(rad: number): number
{
	return (rad * 180) / Math.PI;
}

/**
 * 計算兩點間的平方距離 (度數空間)
 * 僅用於排序或相對距離比較，不代表實際物理距離。
 *
 * 座標參數的順序不影響計算結果
 *
 * [效能優化工具：平方距離比較]
 * -------------------------------------------------------------------------
 * 1. 原理：利用單調性，省略 Math.sqrt() 與三角函數 (sin/cos/atan2)。
 * 2. 效能：運算速度較 Haversine 快約 10~50 倍。
 * 3. 限制：
 * - 不能得到「公尺」。
 * - 不能跨越 180 度經線。
 * - 僅適用於「比較 A 是否比 B 近」。
 * -------------------------------------------------------------------------
 * [開發者建議]
 * 在前端地圖需要即時排序上千個 WiFi 點位時，應優先使用此函數進行初步篩選，
 * 待選出前 10 名後，再針對這 10 名調用 calculateDistance 顯示精確公尺數。
 */
export function calculateSquaredDistance(coord1: IGeoCoord, coord2: IGeoCoord): number
{
	const dLng = coord2.lng - coord1.lng;
	const dLat = coord2.lat - coord1.lat;
	return dLng * dLng + dLat * dLat;
}

/**
 * 考慮緯度校正的平方距離 (精確排序版)
 * 適合跨縣市範圍的距離排序。
 *
 * 座標參數的順序不影響計算結果
 */
export function calculateWeightedSquaredDistance(coord1: IGeoCoord, coord2: IGeoCoord): number
{
	/** 預先計算緯度弧度以獲得收縮比例 */
	const avgLatRad = degToRad((coord1.lat + coord2.lat) / 2);
	const kx = Math.cos(avgLatRad); // 經度相對於緯度的縮放係數

	const dLng = (coord2.lng - coord1.lng) * kx;
	const dLat = coord2.lat - coord1.lat;

	return dLng * dLng + dLat * dLat;
}
