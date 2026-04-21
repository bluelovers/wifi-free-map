/**
 * 設施基地底層介面
 * Station base interface
 *
 * 所有設施類型（WiFi/充電站）共用的基礎介面
 * Common base interface for all facility types (WiFi/charging stations)
 */
import { EnumDatasetType, IGpsCoordinate } from '@/lib/utils/grid/grid-types';

/**
 * 設施基地介面
 * Station base interface
 *
 * 擴展座標介面，包含設施的基本屬性
 * Extends coordinate interface with basic facility properties
 */
export interface IStationBase extends IGpsCoordinate
{
	/** 資料類型 / Data type */
	dataType: EnumDatasetType;
	/** 類別（可選）/ Category (optional) */
	category?: string;

	/** 設施名稱 / Facility name */
	name: string;
	/** 地址 / Address */
	address: string;
}
