/**
 * 網路工具函式
 * Web utility functions
 *
 * 處理與外部網路服務相關的功能
 * Handles functions related to external web services
 */
import { IGeoCoord } from '../grid/grid-types';

/**
 * 建立 Google 地圖導航網址
 * Create Google Maps navigation URL
 *
 * 產生可以用於導航至目標座標的 Google 地圖 URL
 * Generates a Google Maps URL that can be used for navigation to target coordinates
 *
 * @param coord - 目標座標 / Target coordinates
 * @returns Google 地圖導航網址 / Google Maps navigation URL
 */
export function createNavigationUrl(coord: IGeoCoord): string
{
	return `https://www.google.com/maps/dir/?api=1&destination=${coord.lat},${coord.lng}`;
}
