/**
 * 網格區塊聚合器 V2
 * Grid block aggregator V2
 *
 * 使用生成器模式進行資料分割與聚合
 * Uses generator pattern for data splitting and aggregation
 */
import { splitDataByL1GridGenerator } from '@/lib/utils/grid/grid-split';
import {
	IFormatBlockKey,
	IGpsCoordinate,
	IGridBlock,
	ISplitResult,
	IValueArrayOrIterable,
} from '@/lib/utils/grid/grid-types';

/**
 * 建立區塊聚合器 V2
 * Create block aggregator V2
 *
 * 將資料依據 L1 網格進行分割與聚合
 * Splits and aggregates data according to L1 grid
 *
 * @param inputAndOptions - 輸入資料與選項
 * @param inputAndOptions.data - 資料陣列或 Iterable
 * @param inputAndOptions.normalize - 資料正規化函式（可選）
 * @returns 區塊聚合結果
 */
export function createBlockAggregatorV2<T extends IGpsCoordinate, R extends T>(inputAndOptions: {
	data: IValueArrayOrIterable<T>;
	/** 正規化函式 / Normalize function */
	normalize(item: T, items: T[]): R;
})
{
	/** 區塊索引記錄 / Block index record */
	const recordIndex: Record<IFormatBlockKey<'/'>, Record<IFormatBlockKey<'_'>, IGridBlock>> = {};
	/** 分割結果記錄 / Split result record */
	const recordSplit: ISplitResult<R> = {};

	// @ts-ignore
	for (const result of splitDataByL1GridGenerator(inputAndOptions.data))
	{
		if (!result) continue;

		const [bucketPath, blockPath, items] = result;

		recordSplit[bucketPath] ??= {};
		recordSplit[bucketPath][blockPath] ??= [];

		const normalizedItems: R[] = recordSplit[bucketPath][blockPath];

		if (inputAndOptions.normalize)
		{
			/** 對每個項目進行正規化 / Normalize each item */
			for (const item of items)
			{
				const normalizedItem = inputAndOptions.normalize(item, items);
				normalizedItem && normalizedItems.push(normalizedItem);
			}
		}
		else
		{
			/**
			 * 如果沒有正規化函式，直接使用原始資料
			 * If no normalize function, use raw data directly
			 */
			normalizedItems.push(...items as R[]);
		}
	}

	return {
		/** 區塊索引 / Block index */
		recordIndex,
		/** 分割結果 / Split result */
		recordSplit,
	};
}
