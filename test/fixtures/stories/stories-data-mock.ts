import type { IStationBase } from '@/types/station-base';
import { EnumDatasetSource, EnumDatasetType, IGeoPointTupleLatLng } from '@/lib/utils/grid/grid-types';

/**
 * 模擬的 WiFi 熱點資料
 * Mock WiFi hotspot data
 */
export const mockStation: IStationBase = {
	id: 'mock-station-001',
	name: '台北車站 WiFi 熱點',
	address: '台北市中正區北平西路3號',
	lat: 25.0478,
	lng: 121.5170,
	dataType: EnumDatasetType.WIFI,
	dataSource: EnumDatasetSource.GOV_DATA,
};

/**
 * 模擬的充電站資料
 * Mock charging station data
 */
export const mockChargingStation: IStationBase = {
	id: 'mock-charging-001',
	name: '特斯拉超級充電站（台北華納）',
	address: '台北市信義區松壽路20號',
	lat: 25.0360,
	lng: 121.5640,
	dataType: EnumDatasetType.CHARGING,
	dataSource: EnumDatasetSource.GOV_DATA,
};

/**
 * 模擬的使用者位置（台北車站附近）
 * Mock user position (near Taipei Main Station)
 */
export const mockPosition: IGeoPointTupleLatLng = [25.044, 121.520];
