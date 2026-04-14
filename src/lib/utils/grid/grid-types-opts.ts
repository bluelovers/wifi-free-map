/**
 * Created by user on 2026/4/14.
 */

import {
	extractLocationInfo,
	getBlockBounds,
	getBlockCenter,
	getBlockIndex,
} from '../../../../scripts/utils/grid-utils';
import { IGridBlock } from '@/lib/utils/grid/grid-types';

/**
 * 區塊聚合器介面
 * Block aggregator interface
 */
export interface IBlockAggregator
{
	/**
	 * 新增一筆資料至區塊
	 * Add an item to a block
	 *
	 * @param item - 包含 lat, lng, address 的資料物件
	 * @param options - 選項
	 * @param options.type - 資料類型（如 "wifi", "charging"）
	 * @param options.prefix - 檔名稱前輟（如 "grid-wifi/"）
	 */
	add(
		item: { lat: number; lng: number; address?: string },
		options: { type: string; prefix: string },
	): void;

	/**
	 * 建立統一格式的索引表
	 * Build unified index table
	 *
	 * @returns 統一格式的 IGridBlock 陣列
	 */
	build(): IGridBlock[];
}

/**
 * Grid utils 模組介面（從 grid-utils 匯入的函式）
 * Grid utils module interface
 */
export interface IGridUtils
{
	getBlockIndex: typeof getBlockIndex;
	getBlockCenter: typeof getBlockCenter;
	getBlockBounds: typeof getBlockBounds;
	extractLocationInfo: typeof extractLocationInfo;
}
