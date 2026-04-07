/**
 * Wi‑Fi 熱點原始資料型別（iTaiwan 提供）
 * Raw Wi‑Fi hotspot type from iTaiwan dataset.
 */
export interface RawHotspot {
  /** 熱點名稱 */
  // Hotspot name
  hotspot_name: string;
  /** 緯度 */
  // Latitude
  latitude: string;
  /** 經度 */
  // Longitude
  longitude: string;
  /** 地址 */
  // Address
  address: string;
  [key: string]: any; // 其他欄位保留
}

/**
 * 過濾後的 Wi‑Fi 熱點型別，供前端使用
 * Filtered hotspot type for front‑end consumption.
 */
export interface Hotspot {
  /** 熱點名稱 */
  // Hotspot name
  name: string;
  /** 緯度 */
  // Latitude
  lat: number;
  /** 經度 */
  // Longitude
  lng: number;
  /** 地址 */
  // Address
  address: string;
}

/**
 * 將原始資料映射成過濾後的型別
 * Map raw data to the filtered Hotspot type.
 */
export function mapRawToHotspot(raw: RawHotspot): Hotspot {
  return {
    name: raw.hotspot_name,
    lat: Number(raw.latitude),
    lng: Number(raw.longitude),
    address: raw.address,
  };
}
