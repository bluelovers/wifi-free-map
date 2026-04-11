/**
 * 將充電站資料依地圖區塊切割
 * Split charging station data into map grid blocks.
 *
 * 使用與 Wi-Fi 相同的 grid-index.json，但將充電站資料放置於不同子資料夾。
 */

import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** 區塊大小（萬華區的座標範圍） */
const BLOCK_SIZE = 0.0306959;

/** 全台灣座標範圍 */
const TAIWAN_BOUNDS = {
    minLat: 21.903126,
    maxLat: 26.3758,
    minLng: 118.2257211,
    maxLng: 121.948,
};

/**
 * 計算某個經緯度所屬的區塊索引
 */
function getBlockIndex(lat: number, lng: number): { row: number; col: number } {
    const row = Math.floor((lat - TAIWAN_BOUNDS.minLat) / BLOCK_SIZE);
    const col = Math.floor((lng - TAIWAN_BOUNDS.minLng) / BLOCK_SIZE);
    return { row, col };
}

/**
 * 計算區塊的中心點座標
 */
function getBlockCenter(row: number, col: number): { lat: number; lng: number } {
    const lat = TAIWAN_BOUNDS.minLat + (row + 0.5) * BLOCK_SIZE;
    const lng = TAIWAN_BOUNDS.minLng + (col + 0.5) * BLOCK_SIZE;
    return { lat, lng };
}

/**
 * 計算區塊的四角座標點
 */
function getBlockBounds(row: number, col: number): {
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
 */
function extractLocationInfo(address: string): { zipCode: string; city: string; district: string; road: string } {
    if (!address) return { zipCode: "", city: "", district: "", road: "" };

    // 清理地址（移除換行符號）
    const cleanAddress = address.replace(/\n/g, " ").trim();

    const zipMatch = cleanAddress.match(/^(\d{3,5})/);
    const zipCode = zipMatch ? zipMatch[1] : "";

    const cityMatch = cleanAddress.match(/([^\d\s]+(?:市|縣))/);
    const city = cityMatch ? cityMatch[1] : "";

    let remaining = cleanAddress;
    if (city) remaining = cleanAddress.replace(city, "");
    const districtMatch = remaining.match(/([^\d\s]+(?:區|市|鎮|鄉))/);
    const district = districtMatch ? districtMatch[1] : "";

    const roadMatch = cleanAddress.match(/[^\d\s]+(?:路|街|大道)[一二三四五六七八九十]*(?:段)?/);
    const road = roadMatch ? roadMatch[0] : "";

    return { zipCode, city, district, road };
}

/**
 * 主執行函式
 */
async function main() {
    // 讀取現有的 grid-index.json
    const indexPath = resolve(__dirname, "../public/data/grid-index.json");
    const existingIndex = JSON.parse(readFileSync(indexPath, "utf-8"));

    // 讀取充電站資料
    const chargingData = await import("../public/data/charging-stations.json").then((m) => m.default);

    console.log(`載入 ${chargingData.length} 筆充電站資料`);

    // 建立輸出目錄
    const outDir = resolve(__dirname, "../public/data/grid-charging");
    await mkdir(outDir, { recursive: true });

    // 建立區塊索引（僅用於充電站）
    const blockIndex: Map<string, {
        center: { lat: number; lng: number };
        bounds: {
            northWest: { lat: number; lng: number };
            northEast: { lat: number; lng: number };
            southWest: { lat: number; lng: number };
            southEast: { lat: number; lng: number };
        };
        locations: Set<string>;
        count: number;
    }> = new Map();

    // 將每筆資料分配到對應的區塊
    for (const station of chargingData) {
        const { row, col } = getBlockIndex(station.lat, station.lng);
        const blockKey = `${row}-${col}`;

        if (!blockIndex.has(blockKey)) {
            const center = getBlockCenter(row, col);
            const bounds = getBlockBounds(row, col);
            blockIndex.set(blockKey, {
                center,
                bounds,
                locations: new Set(),
                count: 0,
            });
        }

        const block = blockIndex.get(blockKey)!;
        block.count++;

        // 提取並記錄位置資訊
        const { zipCode, city, district, road } = extractLocationInfo(station.address);

        const baseLocation = [zipCode, city, district].filter(Boolean).join("");
        if (baseLocation) block.locations.add(baseLocation);

        if (road) {
            const cleanRoad = road.replace(/^[^\d\s]+(?:市|縣)/, "").replace(/^[^\d\s]+(?:區|市|鎮|鄉)/, "");
            const locationWithRoad = [baseLocation, cleanRoad].filter(Boolean).join("");
            block.locations.add(locationWithRoad);
        }
    }

    console.log(`建立 ${blockIndex.size} 個充電站區塊`);

    // 寫入每個區塊的資料
    let fileCount = 0;
    for (const [blockKey, blockData] of blockIndex) {
        const [row, col] = blockKey.split("-").map(Number);
        const center = blockData.center;

        // 檔名加上 charging- 前綴
        const fileName = `charging-${center.lng.toFixed(4)}_${center.lat.toFixed(4)}.json`;
        const filePath = resolve(outDir, fileName);

        const blockStations = chargingData.filter((s) => {
            const idx = getBlockIndex(s.lat, s.lng);
            return idx.row === row && idx.col === col;
        });

        await writeFile(filePath, JSON.stringify(blockStations, null, 2), "utf-8");
        fileCount++;
    }

    console.log(`已寫入 ${fileCount} 個充電站區塊檔案至 ${outDir}`);

    // 建立充電站區塊索引表
    const chargingIndex = Array.from(blockIndex.entries()).map(([blockKey, blockData]) => {
        const [row, col] = blockKey.split("-").map(Number);
        const center = blockData.center;
        const bounds = blockData.bounds;

        const fileName = `charging-${center.lng.toFixed(4)}_${center.lat.toFixed(4)}.json`;

        return {
            type: "charging",
            fileName,
            center: {
                lat: parseFloat(center.lat.toFixed(6)),
                lng: parseFloat(center.lng.toFixed(6)),
            },
            bounds: {
                northWest: {
                    lat: parseFloat(bounds.northWest.lat.toFixed(6)),
                    lng: parseFloat(bounds.northWest.lng.toFixed(6)),
                },
                northEast: {
                    lat: parseFloat(bounds.northEast.lat.toFixed(6)),
                    lng: parseFloat(bounds.northEast.lng.toFixed(6)),
                },
                southWest: {
                    lat: parseFloat(bounds.southWest.lat.toFixed(6)),
                    lng: parseFloat(bounds.southWest.lng.toFixed(6)),
                },
                southEast: {
                    lat: parseFloat(bounds.southEast.lat.toFixed(6)),
                    lng: parseFloat(bounds.southEast.lng.toFixed(6)),
                },
            },
            count: blockData.count,
            locations: Array.from(blockData.locations).slice(0, 20),
        };
    });

    // 依照區塊中心點排序
    chargingIndex.sort((a, b) => {
        if (a.center.lat !== b.center.lat) return b.center.lat - a.center.lat;
        return a.center.lng - b.center.lng;
    });

    // 合併到現有的 grid-index.json
    // 為現有的 Wi-Fi 區塊添加 type: "wifi"
    const wifiIndexWithType = existingIndex.map((block: any) => ({
        type: "wifi",
        ...block,
    }));

    // 合併兩個索引
    const mergedIndex = [...wifiIndexWithType, ...chargingIndex];

    // 寫入合併後的索引表
    const mergedIndexPath = resolve(__dirname, "../public/data/grid-index.json");
    await writeFile(mergedIndexPath, JSON.stringify(mergedIndex, null, 2), "utf-8");

    console.log(`合併索引表已更新至 ${mergedIndexPath}`);
    console.log(`Wi-Fi 區塊: ${wifiIndexWithType.length}, 充電站區塊: ${chargingIndex.length}`);

    // 統計資訊
    const counts = chargingIndex.map((b) => b.count).sort((a, b) => a - b);
    const minCount = counts[0];
    const maxCount = counts[counts.length - 1];
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

    console.log("");
    console.log("=== 充電站區塊統計 ===");
    console.log(`最小資料數: ${minCount}`);
    console.log(`最大資料數: ${maxCount}`);
    console.log(`平均資料數: ${avgCount.toFixed(1)}`);
}

// 執行
main().catch((error) => {
    console.error("Charging grid split failed:", error);
    process.exit(1);
});