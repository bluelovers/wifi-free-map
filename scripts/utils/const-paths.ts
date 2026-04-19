import { DEFAULT_OUTPUT_DIR } from '@/lib/transform';
import { resolve } from 'path';

// 確保輸出目錄存在
const outDir = resolve(DEFAULT_OUTPUT_DIR);

// 寫入原始檔案（分開儲存，不合併）
export const wifiRawPath = resolve(outDir, "wifi-hotspots-raw.json");
export const taipeiWifiRawPath = resolve(outDir, "taipei-wifi-raw.json");
export const chargingRawPath = resolve(outDir, "charging-stations-raw.json");

export const wifiPath = resolve(outDir, "wifi-hotspots.json");
export const chargingPath = resolve(outDir, "charging-stations.json");
