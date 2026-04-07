/**
 * 充電站原始資料型別（iTaiwan 提供）
 * Raw charging‑station type from iTaiwan dataset.
 */
export interface RawChargingStation {
  /** 站點名稱 */
  // Station name
  StationName: string;
  /** 緯度 */
  // Latitude
  Latitude: string;
  /** 經度 */
  // Longitude
  Longitude: string;
  /** 地址 */
  // Address
  Address: string;
  [key: string]: any; // 其他欄位保留
}

/**
 * 過濾後的充電站型別，供前端使用
 * Filtered charging‑station type for front‑end consumption.
 */
export interface ChargingStation {
  /** 站點名稱 */
  // Station name
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
 * Map raw data to the filtered ChargingStation type.
 */
export function mapRawToCharging(raw: RawChargingStation): ChargingStation {
  return {
    name: raw.StationName,
    lat: Number(raw.Latitude),
    lng: Number(raw.Longitude),
    address: raw.Address,
  };
}
