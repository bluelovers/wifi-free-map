/**
 * 將 Wi-Fi 熱點資料依地圖區塊切割
 * Split Wi-Fi hotspot data into map grid blocks.
 *
 * 使用萬華區的區塊大小 (0.0306959 度) 作為分割標準，將全台灣劃分為多個區塊。
 * 每個區塊產生一個獨立的 JSON 檔案，並建立區塊索引表。
 */

import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import {
    getBlockIndex,
    getBlockCenter,
    getBlockBounds,
    extractLocationInfo,
} from "./utils/grid-utils.js";

/**
 * 主執行函式
 * Main execution function.
 */
async function main() {
    // 讀取 Wi-Fi 熱點資料
    const wifiData = await import("../public/data/wifi-hotspots.json").then((m) => m.default);

    console.log(`載入 ${wifiData.length} 筆 Wi-Fi 熱點資料`);

    // 建立輸出目錄
    const outDir = resolve(__dirname, "../public/data/grid-wifi");
    await mkdir(outDir, { recursive: true });

    // 建立區塊索引
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
    for (const hotspot of wifiData) {
        const { row, col } = getBlockIndex(hotspot.lat, hotspot.lng);
        const blockKey = `${row}-${col}`;

        // 建立區塊資料
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
        const { zipCode, city, district, road } = extractLocationInfo(hotspot.address);

        // 格式：108臺北市萬華區（去除重複的縣市區）
        const baseLocation = [zipCode, city, district].filter(Boolean).join("");
        if (baseLocation) block.locations.add(baseLocation);

        // 格式：108臺北市萬華區XX路一段（去除路名中重複的縣市區）
        if (road) {
            // 從路名中移除已存在的縣市區前綴
            const cleanRoad = road.replace(/^[^\d\s]+(?:市|縣)/, "").replace(/^[^\d\s]+(?:區|市|鎮|鄉)/, "");
            const locationWithRoad = [baseLocation, cleanRoad].filter(Boolean).join("");
            block.locations.add(locationWithRoad);
        }
    }

    console.log(`建立 ${blockIndex.size} 個區塊`);

    // 寫入每個區塊的資料
    let fileCount = 0;
    for (const [blockKey, blockData] of blockIndex) {
        const [row, col] = blockKey.split("-").map(Number);
        const center = blockData.center;

        // 建立區塊資料檔案
        const blockHotspots = wifiData.filter((h) => {
            const idx = getBlockIndex(h.lat, h.lng);
            return idx.row === row && idx.col === col;
        });

        // 檔名使用中心點座標（經度_緯度）
        const fileName = `${center.lng.toFixed(4)}_${center.lat.toFixed(4)}.json`;
        const filePath = resolve(outDir, fileName);

        await writeFile(filePath, JSON.stringify(blockHotspots, null, 2), "utf-8");
        fileCount++;
    }

    console.log(`已寫入 ${fileCount} 個區塊檔案至 ${outDir}`);

    // 建立區塊索引表
    const indexTable = Array.from(blockIndex.entries()).map(([blockKey, blockData]) => {
        const [row, col] = blockKey.split("-").map(Number);
        const center = blockData.center;
        const bounds = blockData.bounds;

        // 檔名
        const fileName = `${center.lng.toFixed(4)}_${center.lat.toFixed(4)}.json`;

        return {
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
            locations: Array.from(blockData.locations).slice(0, 20), // 最多保留 20 個
        };
    });

    // 依照區塊中心點排序
    indexTable.sort((a, b) => {
        if (a.center.lat !== b.center.lat) return b.center.lat - a.center.lat;
        return a.center.lng - b.center.lng;
    });

    // 寫入索引表
    const indexPath = resolve(__dirname, "../public/data/grid-index.json");
    await writeFile(indexPath, JSON.stringify(indexTable, null, 2), "utf-8");

    console.log(`區塊索引表已寫入 ${indexPath}`);
    console.log(`總計: ${indexTable.length} 個區塊`);

    // 統計資訊
    const counts = indexTable.map((b) => b.count).sort((a, b) => a - b);
    const minCount = counts[0];
    const maxCount = counts[counts.length - 1];
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

    console.log("");
    console.log("=== 區塊統計 ===");
    console.log(`最小資料數: ${minCount}`);
    console.log(`最大資料數: ${maxCount}`);
    console.log(`平均資料數: ${avgCount.toFixed(1)}`);
}

// 執行
main().catch((error) => {
    console.error("Grid split failed:", error);
    process.exit(1);
});