/**
 * 將已下載的原始 JSON 檔案轉換為結構化資料
 * Convert downloaded raw JSON files to structured data.
 *
 * 此腳本會讀取已經下載的 raw 檔案並進行轉換，
 * 不需要再次從網路下載。
 *
 * 使用方式：
 * - 轉換所有檔案：pnpm ts-node scripts/convert-raw.ts
 * - 只轉換 Wi-Fi：pnpm ts-node scripts/convert-raw.ts --wifi
 * - 只轉換充電站：pnpm ts-node scripts/convert-raw.ts --charging
 *
 * Run:
 * - Convert all: pnpm ts-node scripts/convert-raw.ts
 * - Wi‑Fi only: pnpm ts-node scripts/convert-raw.ts --wifi
 * - Charging only: pnpm ts-node scripts/convert-raw.ts --charging
 */

import { writeFile, mkdir, access } from "fs/promises";
import { resolve } from "path";
import {
    convertWiFiArray,
    convertChargingArray,
    DEFAULT_OUTPUT_DIR,
} from "../src/lib/transform";

/**
 * 預設的輸入目錄
 * Default input directory.
 */
const INPUT_DIR = DEFAULT_OUTPUT_DIR;

/**
 * 確保目錄存在
 * Ensure directory exists.
 *
 * @param dirPath - 目錄路徑
 */
async function ensureDir(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
}

/**
 * 檢查檔案是否存在
 * Check if file exists.
 *
 * @param filePath - 檔案路徑
 * @returns 是否存在
 */
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * 讀取 JSON 檔案
 * Read JSON file.
 *
 * @param filePath - 檔案路徑
 * @returns 解析後的資料
 */
async function readJSON<T = any[]>(filePath: string): Promise<T> {
    const { readFile } = await import("fs/promises");
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
}

/**
 * 寫入 JSON 檔案
 * Write JSON file.
 *
 * @param filePath - 檔案路徑
 * @param data - 要寫入的資料
 */
async function writeJSON(filePath: string, data: any): Promise<void> {
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 轉換 Wi-Fi 資料
 * Convert Wi‑Fi data.
 *
 * @param inputDir - 輸入目錄
 * @param outputDir - 輸出目錄
 */
async function convertWiFi(inputDir: string, outputDir: string): Promise<number> {
    const rawPath = resolve(inputDir, "wifi-hotspots-raw.json");
    const exists = await fileExists(rawPath);

    if (!exists) {
        console.warn(`⚠️  Wi‑Fi raw file not found: ${rawPath}`);
        return 0;
    }

    console.log(`Reading Wi‑Fi raw data from ${rawPath}…`);
    const rawData = await readJSON(rawPath);

    console.log(`Converting Wi‑Fi data (${rawData.length} items)…`);
    const filtered = convertWiFiArray(rawData);

    const outputPath = resolve(outputDir, "wifi-hotspots.json");
    await writeJSON(outputPath, filtered);

    console.log(`✅ Wi‑Fi: ${filtered.length} items written to ${outputPath}`);
    return filtered.length;
}

/**
 * 轉換充電站資料
 * Convert charging station data.
 *
 * @param inputDir - 輸入目錄
 * @param outputDir - 輸出目錄
 */
async function convertCharging(inputDir: string, outputDir: string): Promise<number> {
    const rawPath = resolve(inputDir, "charging-stations-raw.json");
    const exists = await fileExists(rawPath);

    if (!exists) {
        console.warn(`⚠️  Charging raw file not found: ${rawPath}`);
        return 0;
    }

    console.log(`Reading charging raw data from ${rawPath}…`);
    const rawData = await readJSON(rawPath);

    console.log(`Converting charging data (${rawData.length} items)…`);
    const filtered = convertChargingArray(rawData);

    const outputPath = resolve(outputDir, "charging-stations.json");
    await writeJSON(outputPath, filtered);

    console.log(`✅ Charging: ${filtered.length} items written to ${outputPath}`);
    return filtered.length;
}

/**
 * 主執行函式
 * Main execution function.
 */
async function main() {
    // 解析命令列參數
    const args = process.argv.slice(2);
    const doWiFi = args.includes("--wifi") || args.length === 0;
    const doCharging = args.includes("--charging") || args.length === 0;

    console.log("=".repeat(50));
    console.log("Convert Raw Data Script");
    console.log("=".repeat(50));
    console.log(`Input directory:  ${INPUT_DIR}`);
    console.log(`Output directory: ${DEFAULT_OUTPUT_DIR}`);
    console.log(`Options: Wi‑Fi: ${doWiFi ? "✓" : "✗"}, Charging: ${doCharging ? "✓" : "✗"}`);
    console.log("=".repeat(50));

    // 確保輸出目錄存在
    await ensureDir(DEFAULT_OUTPUT_DIR);

    let wifiCount = 0;
    let chargingCount = 0;

    if (doWiFi) {
        wifiCount = await convertWiFi(INPUT_DIR, DEFAULT_OUTPUT_DIR);
    }

    if (doCharging) {
        chargingCount = await convertCharging(INPUT_DIR, DEFAULT_OUTPUT_DIR);
    }

    console.log("=".repeat(50));
    console.log(`Summary: Wi‑Fi: ${wifiCount}, Charging: ${chargingCount}`);
    console.log("=".repeat(50));

    if (wifiCount === 0 && chargingCount === 0) {
        console.warn("⚠️  No data converted. Make sure raw files exist in public/data/");
        process.exit(1);
    }
}

// 執行
main().catch((error) => {
    console.error("Convert script failed:", error);
    process.exit(1);
});