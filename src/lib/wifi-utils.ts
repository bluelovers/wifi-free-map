import QRCode from 'qrcode';

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
	encryption: 'WPA' | 'WEP' | 'nopass' = 'WPA',
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
