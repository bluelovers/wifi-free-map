/**
 * 地圖區塊計算工具
 * Grid calculation utilities for splitting geographic data into map blocks.
 *
 * 提供共用的座標計算與地址解析函式，供 split-grid-wifi.ts
 * 與 split-grid-charging.ts 等腳本使用。
 */

/** 區塊大小（萬華區的座標範圍） */
export const BLOCK_SIZE = 0.0306959;

/** 全台灣座標範圍 */
export const TAIWAN_BOUNDS = {
    minLat: 21.903126,
    maxLat: 26.3758,
    minLng: 118.2257211,
    maxLng: 121.948,
} as const;

/**
 * 計算某個經緯度所屬的區塊索引
 * Calculate the block index for a given coordinate.
 *
 * @param lat - 緯度
 * @param lng - 經度
 * @returns 區塊索引 { row, col }
 */
export function getBlockIndex(lat: number, lng: number): { row: number; col: number } {
    const row = Math.floor((lat - TAIWAN_BOUNDS.minLat) / BLOCK_SIZE);
    const col = Math.floor((lng - TAIWAN_BOUNDS.minLng) / BLOCK_SIZE);
    return { row, col };
}

/**
 * 計算區塊的中心點座標
 * Calculate the center coordinate of a block.
 *
 * @param row - 區塊列索引
 * @param col - 區塊行索引
 * @returns 中心點座標 { lat, lng }
 */
export function getBlockCenter(row: number, col: number): { lat: number; lng: number } {
    const lat = TAIWAN_BOUNDS.minLat + (row + 0.5) * BLOCK_SIZE;
    const lng = TAIWAN_BOUNDS.minLng + (col + 0.5) * BLOCK_SIZE;
    return { lat, lng };
}

/**
 * 計算區塊的四角座標點
 * Calculate the four corner coordinates of a block.
 *
 * @param row - 區塊列索引
 * @param col - 區塊行索引
 * @returns 四角座標點 { northWest, northEast, southWest, southEast }
 */
export function getBlockBounds(row: number, col: number): {
    northWest: { lat: number; lng: number };
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
    southEast: { lat: number; lng: number };
} {
    const north = TAIWAN_BOUNDS.minLat + (row + 1) * BLOCK_SIZE;
    const south = TAIWAN_BOUNDS.minLat + row * BLOCK_SIZE;
    const east = TAIWAN_BOUNDS.minLng + (col + 1) * BLOCK_SIZE;
    const west = TAIWAN_BOUNDS.minLng + col * BLOCK_SIZE;

    return {
        northWest: { lat: north, lng: west },
        northEast: { lat: north, lng: east },
        southWest: { lat: south, lng: west },
        southEast: { lat: south, lng: east },
    };
}

/**
 * 從地址中提取各部分
 * Extract parts from address.
 *
 * @param address - 地址文字
 * @returns 提取的區域資訊 { zipCode, city, district, road }
 */
export function extractLocationInfo(
    address: string,
): { zipCode: string; city: string; district: string; road: string } {
    if (!address) return { zipCode: "", city: "", district: "", road: "" };

    // 清理地址（移除換行符號）
    const cleanAddress = address.replace(/\n/g, " ").trim();

    // 提取郵遞區號（3碼或5碼數字）
    const zipMatch = cleanAddress.match(/^(\d{3,5})/);
    const zipCode = zipMatch ? zipMatch[1] : "";

    // 嘗試匹配縣市（XX市 或 XX縣）
    const cityMatch = cleanAddress.match(/([^\d\s]+(?:市|縣))/);
    const city = cityMatch ? cityMatch[1] : "";

    // 嘗試匹配行政區（XX區 或 XX市）
    let remaining = cleanAddress;
    if (city) remaining = cleanAddress.replace(city, "");
    const districtMatch = remaining.match(/([^\d\s]+(?:區|市|鎮|鄉))/);
    const district = districtMatch ? districtMatch[1] : "";

    // 嘗試匹配路名（不包含門牌號碼）
    const roadMatch = cleanAddress.match(/[^\d\s]+(?:路|街|大道)[一二三四五六七八九十]*(?:段)?/);
    const road = roadMatch ? roadMatch[0] : "";

    return { zipCode, city, district, road };
}
