import { IGpsCoordinate } from '@/lib/utils/grid/grid-types';

export interface IStationBase extends IGpsCoordinate
{
	/**
	 * 熱點名稱 / 充電站
	 * Hotspot name
	 */
	name: string;
	/** 地址 / Address */
	address: string;
}
