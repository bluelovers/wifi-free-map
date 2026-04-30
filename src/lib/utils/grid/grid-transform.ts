import { BLOCK_SIZE, GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_PRECISION } from '@/lib/utils/grid/grid-const';
import { _normalizeCoordScalarCore } from '@/lib/utils/geo/geo-transform';

/**
 * 區塊索引轉座標（單一維度）
 * Block index to coordinate (single dimension)
 *
 * 算出該區塊的左下角座標
 * Calculates the bottom-left coordinates of that block
 *
 * 將網格索引轉換回單一維度的座標值
 * Transform a grid index back into a continuous coordinate
 *
 * 原理：
 * 1. (idx * size) 算出該網格起始點相對於原點的物理距離。
 * 2. 加上 base 得到該網格在全域座標系中的絕對位置（通常為左下角 Minimum Boundary）。
 * 3. 透過 _normalizeCoordScalarCore 修正至全域指定的浮點數精度，確保 API 參數一致性。
 *
 * @param idx - 區塊索引 / Block index （由 _calCoordScalarToIndexGeneric 算出）
 * @param base - 基準座標（原點）/ Base coordinate (origin)
 * @param size - 網格的大小步長（如：BLOCK_SIZE 或 snapSize）
 * @returns 座標值 / Coordinate value
 */
export function _calcBlockIndexToRangeScalarCore(idx: number, base: number, size: number = BLOCK_SIZE)
{
	/**
	 * 核心公式：基準座標 + (區塊索引 * 區塊大小)
	 * Core formula: base + (block index * block size)
	 *
	 * 固定精度以確保座標儲存的一致性
	 * Fixed precision ensures consistent coordinate storage
	 */
	return _normalizeCoordScalarCore(base + idx * size, GLOBAL_GRID_CONFIG_PRECISION);
}

/**
 * 核心公式：座標轉區塊索引（單一維度）
 * Core formula: coordinate to block index (single dimension)
 *
 * 不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 * Regardless of positive/negative, floor can correctly find the "minimum boundary" of that block
 *
 * 將單一維度的座標值轉換為網格索引
 * Transform a continuous coordinate into a discrete grid index
 *
 * 原理：
 * 1. (current - base) 算出相對於原點的位移量。（網格系統的原點座標，例如：TAIWAN_BOUNDS.minLng）
 * 2. 加上 EPSILON 修正浮點數運算誤差，確保邊界上的點不會因精度問題掉入前一個網格。
 * 3. 除以 size 並使用 Math.floor，將範圍內的連續數值「收斂」至同一個整數索引。
 *
 * @param current - 當前座標 / Current coordinate
 * @param base - 基準座標（原點）/ Base coordinate (origin)
 * @param size - 網格的大小步長（如：BLOCK_SIZE 或 snapSize）
 * @returns 區塊索引 / Block index
 */
export function _calCoordScalarToBlockIndexCore(current: number, base: number, size: number = BLOCK_SIZE)
{
	/**
	 * 使用 epsilon 修正浮點數計算誤差，確保邊界情況正確處理
	 * Uses epsilon to correct floating-point calculation errors, ensuring correct boundary handling
	 */
	return Math.floor((current - base + GLOBAL_GRID_CONFIG_EPSILON) / size);
}
