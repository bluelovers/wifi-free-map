/**
 * [地理運算核心說明]
 * 1. 距離計算 (Haversine)：適用於一般導航距離，未考慮地球橢球體偏差（誤差約 0.3%）。
 * 2. 方位角 (Bearing)：以正北為 0°。
 * 3. TWD97 轉換：專為台灣地區二度分帶座標設計，中央子午線設為 121°E。
 * 4. 座標順序：所有輸入參數統一維持 {@link IGeoCoord}。
 */
import { IGeoCoord, IXYCoord } from '@/lib/utils/grid/grid-types';
import { degToRad } from '@/lib/utils/geo/geo-math';
import { EARTH_WGS84_EQUATORIAL_RADIUS } from '@/lib/utils/grid/grid-const';

/**
 * 將經緯度轉為像素座標 (Web Mercator)
 * @param zoom 地圖縮放層級
 * @param tileSize 地圖瓦片大小 (預設 256)
 */
export function lngLatToPixel({ lat, lng }: IGeoCoord, zoom: number, tileSize = 256): IXYCoord
{
	const sinLat = Math.sin(degToRad(lat));
	const x = (lng + 180) / 360;
	const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);

	const scale = tileSize * Math.pow(2, zoom);

	return {
		x: Math.floor(x * scale),
		y: Math.floor(y * scale),
	};
}

/**
 * 將 WGS84 座標轉換為 TWD97 二度分帶座標 (TM2)
 * 公式參考自：中央研究院 橫麥卡托投影座標轉換公式
 *
 * @remarks
 * 此函數基於【WGS84 參考橢球體】模型，使用赤道半徑 (6,378,137m) 與扁平率進行投影。
 * 【精度說明】
 * - 適用場景：精確地圖投影、與台灣二度分帶 (TWD97) 系統對接、地籍邊界判定。
 * - 核心常數：中央子午線 121°E，投影比例因子 0.9999。
 * - 注意事項：涉及橢球體複雜數學，計算成本較高，不建議用於高頻率的點位排序。
 *
 * @param lng - 經度 (WGS84)
 * @param lat - 緯度 (WGS84)
 * @returns TWD97 投影座標 {x, y}
 */
export function wgs84ToTwd97({ lat, lng }: IGeoCoord): IXYCoord
{
	const a = EARTH_WGS84_EQUATORIAL_RADIUS;
	const b = 6356752.314245;
	const lon0 = 121 * Math.PI / 180; // 台灣中央子午線 121度
	const k0 = 0.9999;
	const dx = 250000;

	const e = Math.pow(1 - Math.pow(b, 2) / Math.pow(a, 2), 0.5);
	const e2 = Math.pow(e, 2) / (1 - Math.pow(e, 2));

	const n = (a - b) / (a + b);
	const nu = a / Math.pow(1 - Math.pow(e, 2) * Math.pow(Math.sin(lat * Math.PI / 180), 2), 0.5);
	const p = lng * Math.PI / 180 - lon0;

	const A = a * (1 - n + (5 / 4) * (Math.pow(n, 2) - Math.pow(n, 3)) + (81 / 64) * (Math.pow(n, 4) - Math.pow(n, 5)));
	const B = (3 * a * n / 2) * (1 - n + (7 / 8) * (Math.pow(n, 2) - Math.pow(n, 3)) + (55 / 64) * (Math.pow(n, 4) - Math.pow(n, 5)));
	const C = (15 * a * Math.pow(n, 2) / 16) * (1 - n + (3 / 4) * (Math.pow(n, 2) - Math.pow(n, 3)));
	const D = (35 * a * Math.pow(n, 3) / 48) * (1 - n + (11 / 16) * (Math.pow(n, 2) - Math.pow(n, 3)));
	const E = (315 * a * Math.pow(n, 4) / 512) * (1 - n);

	const latRad = lat * Math.PI / 180;
	const S = A * latRad - B * Math.sin(2 * latRad) + C * Math.sin(4 * latRad) - D * Math.sin(6 * latRad) + E * Math.sin(8 * latRad);

	const T = Math.pow(Math.tan(latRad), 2);
	const C_prime = e2 * Math.pow(Math.cos(latRad), 2);

	const x = dx + k0 * nu * (p * Math.cos(latRad) + (Math.pow(p, 3) * Math.pow(Math.cos(latRad), 3) / 6) * (1 - T + C_prime) + (Math.pow(p, 5) * Math.pow(Math.cos(latRad), 5) / 120) * (5 - 18 * T + Math.pow(T, 2) + 72 * C_prime - 58 * e2));
	const y = k0 * (S + nu * Math.tan(latRad) * (Math.pow(p, 2) * Math.pow(Math.cos(latRad), 2) / 2 + (Math.pow(p, 4) * Math.pow(Math.cos(latRad), 4) / 24) * (5 - T + 9 * C_prime + 4 * Math.pow(C_prime, 2)) + (Math.pow(p, 6) * Math.pow(Math.cos(latRad), 6) / 720) * (61 - 58 * T + Math.pow(T, 2) + 600 * C_prime - 330 * e2)));

	return { x, y };
}
