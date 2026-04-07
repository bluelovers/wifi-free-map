import QRCode from 'qrcode';
import type { IWiFiHotspot } from '@/types';

/**
 * 生成 WiFi QR Code
 * Generate WiFi QR Code
 *
 * @param ssid - WiFi SSID
 * @param password - WiFi 密碼
 * @param encryption - 加密類型 (WPA, WEP, nopass)
 * @returns QR Code Data URL
 */
export async function generateWiFiQRCode(
    ssid: string,
    password: string,
    encryption: 'WPA' | 'WEP' | 'nopass' = 'WPA'
): Promise<string>
{
    // WiFi QR Code 格式: WIFI:T:WPA;S:SSID;P:PASSWORD;;
    const wifiString = ` WIFI:T:${encryption};S:${ssid};P:${password};;`;
    return QRCode.toDataURL(wifiString, {
        width: 200,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    });
}

/**
 * 生成 Android WiFi 連線連結
 * Generate Android WiFi connection link
 *
 * @param ssid - WiFi SSID
 * @param password - WiFi 密碼
 * @returns Android intent URI
 */
export function generateAndroidWiFiLink(ssid: string, password: string): string
{
    // 編碼 SSID 和密碼
    const encodedSSID = encodeURIComponent(ssid);
    const encodedPassword = encodeURIComponent(password);

    return `WIFI:T:WPA;S:${encodedSSID};P:${encodedPassword};;`;
}

/**
 * 生成 iOS WiFi 連線資訊（需手動複製）
 * Generate iOS WiFi connection info (needs manual copy)
 *
 * @param ssid - WiFi SSID
 * @param password - WiFi 密碼
 * @returns 連線資訊物件
 */
export function generateiOSWiFiInfo(ssid: string, password: string): {
    ssid: string;
    password: string;
}
{
    return { ssid, password };
}

/**
 * 計算兩點之間的距離（公尺）
 * Calculate distance between two points (meters)
 *
 * @param lat1 - 點 1 緯度
 * @param lng1 - 點 1 經度
 * @param lat2 - 點 2 緯度
 * @param lng2 - 點 2 經度
 * @returns 距離（公尺）
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number
{
    const R = 6371e3; // 地球半徑（公尺）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 距離（公尺）
}

/**
 * 根據距離排序熱點
 * Sort hotspots by distance
 *
 * @param hotspots - 熱點陣列
 * @param userLat - 使用者緯度
 * @param userLng - 使用者經度
 * @returns 排序後的熱點陣列
 */
export function sortHotspotsByDistance(
    hotspots: IWiFiHotspot[],
    userLat: number,
    userLng: number
): IWiFiHotspot[]
{
    return [...hotspots].sort((a, b) => {
        const distA = calculateDistance(userLat, userLng, a.location.lat, a.location.lng);
        const distB = calculateDistance(userLat, userLng, b.location.lat, b.location.lng);
        return distA - distB;
    });
}