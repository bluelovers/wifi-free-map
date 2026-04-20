/**
 * Unit tests for data transformation utilities.
 * 測試資料轉換函式，確保未來修改不會破壞鍵名映射。
 */
import { IRawChargingStation } from "../src/types/station-charging";
import { convertWiFiRaw_iTaiwan, convertChargingRaw } from "../src/lib/transform";
import { describe, it, expect } from "@jest/globals";

describe('convertWiFiRaw', () => {
  it('should correctly map English keys to Hotspot', () => {
    const raw = {
      Name: 'Test hotspot',
      Latitude: '25.0330',
      Longitude: '121.5654',
      Address: 'Taipei',
    };
    const result = convertWiFiRaw_iTaiwan(raw as any);
    expect(result).toEqual({
      name: 'Test hotspot',
      lat: 25.033,
      lng: 121.5654,
      address: 'Taipei',
    });
  });
});

describe('convertChargingRaw', () => {
  it('should correctly map Chinese keys to ChargingStation', () => {
    const raw: IRawChargingStation = {
      "充電站名稱": 'Station A',
      "緯度": '24.1500',
      "經度": '120.6833',
      "地址": 'Taichung',
    };
    const result = convertChargingRaw(raw);
    expect(result).toEqual({
      name: 'Station A',
      lat: 24.15,
      lng: 120.6833,
      address: 'Taichung',
    });
  });
});
