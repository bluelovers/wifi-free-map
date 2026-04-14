import { BLOCK_SIZE, TAIWAN_BOUNDS } from './grid-const';
import { IGpsBlockIndex, IGpsCoordinate, IGpsLatLngMaxMin } from './grid-types';

/**
 * 全球通用網格配置
 *
 * 建議使用 (0,0) 或 (-180, -90) 作為全球唯一原點，這樣最直覺
 * 如果想沿用你原本的台灣設定也完全沒問題
 */
export const GLOBAL_GRID_CONFIG_ORIGIN = {
	lng: TAIWAN_BOUNDS.minLng,
	lat: TAIWAN_BOUNDS.minLat,
} as const;

export const GLOBAL_GRID_CONFIG_PRECISION = 4 as const;
export const GLOBAL_GRID_CONFIG_EPSILON = 1e-9;

/**
 * 全球通用：座標轉區塊 ID
 * 不論給入哪裡的座標，都會自動對齊到 GLOBAL_GRID_CONFIG_ORIGIN 出發的全球網格
 */
export function calcGlobalBlockIndex(lng: number, lat: number)
{
	/**
	 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
	 */
	const { xIdx, yIdx } = _calcCcoordToBlockIndex({ lng, lat });

	/**
	 * 算出該區塊的左下角座標
	 */
	const { minLng, minLat } = _calcBlockIndexToCoord({ xIdx, yIdx });

	return {
		xIdx,
		yIdx,
		minLng,
		minLat,
	};
};

/**
 * 格式化區塊鍵值
 */
export function _formatBlockKey(lng: number | string, lat: number | string): `${number}_${number}`
{
	const lngStr = typeof lng === 'number' ? lng.toFixed(GLOBAL_GRID_CONFIG_PRECISION) : lng;
	const latStr = typeof lat === 'number' ? lat.toFixed(GLOBAL_GRID_CONFIG_PRECISION) : lat;

	return `${lngStr}_${latStr}` as `${number}_${number}`;
}

/**
 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 */
export function _calCcoordToBlockIndexCore(current: number, base: number)
{
	return Math.floor((current - base + GLOBAL_GRID_CONFIG_EPSILON) / BLOCK_SIZE);
}

/**
 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 */
export function _calcCcoordToBlockIndex({ lng, lat }: IGpsCoordinate): IGpsBlockIndex
{
	const xIdx = _calCcoordToBlockIndexCore(lng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const yIdx = _calCcoordToBlockIndexCore(lat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	return { xIdx, yIdx };
}

/**
 * 算出該區塊的左下角座標
 */
export function _calcBlockIndexToCoordCore(idx: number, base: number)
{
	return parseFloat((base + idx * BLOCK_SIZE).toFixed(GLOBAL_GRID_CONFIG_PRECISION))
}

/**
 * 算出該區塊的左下角座標
 */
export function _calcBlockIndexToCoord({ xIdx, yIdx }: { xIdx: number; yIdx: number })
{
	const minLng = _calcBlockIndexToCoordCore(xIdx, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const minLat = _calcBlockIndexToCoordCore(yIdx, GLOBAL_GRID_CONFIG_ORIGIN.lat);

	return {
		minLng,
		minLat,
	};
}

/**
 * 4. 組合功能：取得一個矩形範圍內所有的區塊 IDs
 * 這個函式保證結果只會是 1, 2, 4 (或更多，取決於 range 大小，但一定是矩形數量)
 */
export function calcBlockIdsInRange(range: IGpsLatLngMaxMin)
{
	const idBounds = _getBlockIdsInRangeCore(range);

	const matchedBlocks = _detectIdBoundsMatchedBlock(idBounds);

	return {
		idBounds,
		matchedBlocks,
	};
};

interface IBlockIndexBounds
{
	startX: number;
	endX: number;
	startY: number;
	endY: number;
}

/**
 * 4. 組合功能：取得一個矩形範圍內所有的區塊 IDs
 * 這個函式保證結果只會是 1, 2, 4 (或更多，取決於 range 大小，但一定是矩形數量)
 */
export function _getBlockIdsInRangeCore({
	minLng,
	minLat,
	maxLng,
	maxLat,
}: IGpsLatLngMaxMin): IBlockIndexBounds
{
	const startX = _calCcoordToBlockIndexCore(minLng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const endX = _calCcoordToBlockIndexCore(maxLng - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lng);

	const startY = _calCcoordToBlockIndexCore(minLat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	const endY = _calCcoordToBlockIndexCore(maxLat - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lat);

	return {
		startX,
		endX,
		startY,
		endY,
	};
}

export function _detectIdBoundsMatchedBlock(idBounds: IBlockIndexBounds)
{
	const matchedBlocks: ReturnType<typeof _formatBlockKey>[] = [];

	for (let x = idBounds.startX; x <= idBounds.endX; x++)
	{
		for (let y = idBounds.startY; y <= idBounds.endY; y++)
		{
			const minLng = _calcBlockIndexToCoordCore(x, GLOBAL_GRID_CONFIG_ORIGIN.lng);
			const minLat = _calcBlockIndexToCoordCore(y, GLOBAL_GRID_CONFIG_ORIGIN.lat);
			matchedBlocks.push(_formatBlockKey(minLng, minLat));
		}
	}

	return matchedBlocks;
}

export function _idBoundsToRange(idBounds: IBlockIndexBounds): IGpsLatLngMaxMin
{
	return {
		minLat: _calcBlockIndexToCoordCore(idBounds.startX, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		maxLat: _calcBlockIndexToCoordCore(idBounds.endX, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		minLng: _calcBlockIndexToCoordCore(idBounds.startY, GLOBAL_GRID_CONFIG_ORIGIN.lat),
		maxLng: _calcBlockIndexToCoordCore(idBounds.endY, GLOBAL_GRID_CONFIG_ORIGIN.lat),
	};
}
