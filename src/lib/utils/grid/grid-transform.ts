import { BLOCK_SIZE, GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_PRECISION } from '@/lib/utils/grid/grid-const';
import { _normalizeCoordScalarCore } from '@/lib/utils/geo/geo-transform';

/**
 * 區塊索引轉座標（單一維度）
 * Block index to coordinate (single dimension)
 *
 * 算出該區塊的左下角座標
 * Calculates the bottom-left coordinates of that block
 *
 * @param idx - 區塊索引 / Block index
 * @param base - 基準座標（原點）/ Base coordinate (origin)
 * @returns 座標值 / Coordinate value
 */
export function _calcBlockIndexToRangeScalarCore(idx: number, base: number)
{
	/**
	 * 核心公式：基準座標 + (區塊索引 * 區塊大小)
	 * Core formula: base + (block index * block size)
	 *
	 * 固定精度以確保座標儲存的一致性
	 * Fixed precision ensures consistent coordinate storage
	 */
	return _normalizeCoordScalarCore(base + idx * BLOCK_SIZE, GLOBAL_GRID_CONFIG_PRECISION)
}

/**
 * 核心公式：座標轉區塊索引（單一維度）
 * Core formula: coordinate to block index (single dimension)
 *
 * 不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 * Regardless of positive/negative, floor can correctly find the "minimum boundary" of that block
 *
 * @param current - 當前座標 / Current coordinate
 * @param base - 基準座標（原點）/ Base coordinate (origin)
 * @returns 區塊索引 / Block index
 */
export function _calCoordScalarToBlockIndexCore(current: number, base: number)
{
	/**
	 * 使用 epsilon 修正浮點數計算誤差，確保邊界情況正確處理
	 * Uses epsilon to correct floating-point calculation errors, ensuring correct boundary handling
	 */
	return Math.floor((current - base + GLOBAL_GRID_CONFIG_EPSILON) / BLOCK_SIZE);
}
