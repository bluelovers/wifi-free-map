/**
 * 網格工具選項類型
 * Grid utilities option types for type definitions.
 */

import { IGridBlock, ILocationInfo } from "./grid-types";
import { extractLocationInfo } from "./grid-address";
import {
	getBlockBounds,
	getBlockCenter,
	getBlockIndex,
} from "./grid-computation";

/**
 * 區塊聚合器介面
 * Block aggregator interface
 *
 * 用於將地理資料依據網格進行聚合的介面
 * Interface for aggregating geographic data according to grid
 */
export interface IBlockAggregator
{
	/**
	 * 新增一筆資料至區塊
	 * Add an item to a block
	 *
	 * @param item - 包含 lat, lng, address 的資料物件 / Data object containing lat, lng, address
	 * @param options - 選項 / Options
	 * @param options.type - 資料類型（如 "wifi", "charging"）/ Data type (e.g., "wifi", "charging")
	 * @param options.prefix - 檔名稱前輟（如 "grid-wifi/"）/ File name prefix (e.g., "grid-wifi/")
	 */
	add(
		item: { lat: number; lng: number; address?: string },
		options: { type: string; prefix: string },
	): void;

	/**
	 * 建立統一格式的索引表
	 * Build unified index table
	 *
	 * @returns 統一格式的 IGridBlock 陣列 / Array of IGridBlock in unified format
	 */
	build(): IGridBlock[];
}

/**
 * Grid utils 模組介面
 * Grid utils module interface
 *
 * 透過 grid-computation 模組提供
 * Provided through grid-computation module
 */
export interface IGridUtils
{
	/** 計算區塊索引 / Calculate block index */
	getBlockIndex: typeof getBlockIndex;
	/** 計算區塊中心點 / Calculate block center */
	getBlockCenter: typeof getBlockCenter;
	/** 計算區塊邊界 / Calculate block bounds */
	getBlockBounds: typeof getBlockBounds;
	/** 解析位置資訊 / Extract location information */
	extractLocationInfo: typeof extractLocationInfo;
}
