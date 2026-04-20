import { __DATA_ROOT } from '@/lib/__root';
import { resolve } from 'path';

/** 寫入原始檔案（分開儲存，不合併） */
export const wifiRawPath_iTaiwan = resolve(__DATA_ROOT, 'raw/wifi', 'wifi-hotspots-raw.json');
export const wifiRawPath_TaipeiFree = resolve(__DATA_ROOT, 'raw/wifi', 'taipei-wifi-raw.json');

export const chargingRawPath = resolve(__DATA_ROOT, 'raw', 'charging-stations-raw.json');

/** 作為後續切割資料使用 */
export const wifiNormalizePath = resolve(__DATA_ROOT, 'raw-normalize', 'wifi-hotspots.json');
export const chargingNormalizePath = resolve(__DATA_ROOT, 'raw-normalize', 'charging-stations.json');

export const categorySetPath = resolve(__DATA_ROOT, 'raw-normalize', 'category-set.json');
