import { BLOCK_SIZE, TAIWAN_BOUNDS } from './grid-const';
import {
	IBounds,
	IGpsBlockIndex,
	IGpsCoordinate, IGpsLngLatMax,
	IGpsLngLatMin,
	IGpsLngLatMinMax,
	IGpsRowColStartEnd,
} from './grid-types';

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
export const GLOBAL_GRID_CONFIG_EPSILON = 1e-9 as const;

/**
 * 擴充配置：分流設定
 *
 * 15x15 個區塊為一組
 *
 * 根據地理資訊，台北市的極值大約如下：
 * 緯度 (Lat)：24.961° ~ 25.210°（跨度約 0.249°）
 * 經度 (Lng)：121.457° ~ 121.666°（跨度約 0.209°）
 *
 * 台北市的座標範圍大約 11x13 個區塊
 *
 * 層級規模換算表
 * 層級 (Level) 跨度 (度)     物理尺寸 (約略)   覆蓋能力範例
 * L0 (底層)    0.02°        2.1 km          西門町、萬華車站周邊
 * L1 (資料夾層) 0.30°        32 km           台北市 + 新北市核心區
 * L2 (區域層)   4.50°       480 km          全台灣 (南北約 3.5°)
 * L3 (跨國層)   67.5°     7,200 km          整個中國 + 大部分東南亞
 *
 * 基於此，我們可以設定 15x15 個區塊為一組
 */
export const BUCKET_CONFIG_GROUP_SIZE = 15 as const;

/**
 * 全球通用：座標轉區塊 ID
 * 不論給入哪裡的座標，都會自動對齊到 GLOBAL_GRID_CONFIG_ORIGIN 出發的全球網格
 */
export function calcGlobalBlockIndexAndCoord({ lng, lat }: IGpsCoordinate): IGpsBlockIndex & IGpsLngLatMin
{
	/**
	 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
	 */
	const { xIdx, yIdx } = _calcCoordToBlockIndex({ lng, lat });

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

export type IFormatBlockKey<S extends string = '_'> = `${number}${S}${number}`;

/**
 * 格式化區塊鍵值
 *
 * @param x_lng x lng 經度
 * @param y_lat y lat 緯度
 * @param opts
 */
export function _formatBlockKey<S extends string = '_'>(x_lng: number | string, y_lat: number | string, opts?: {
	sep?: S;
}): IFormatBlockKey<S>
{
	const lngStr = typeof x_lng === 'number' ? x_lng.toFixed(GLOBAL_GRID_CONFIG_PRECISION) : x_lng;
	const latStr = typeof y_lat === 'number' ? y_lat.toFixed(GLOBAL_GRID_CONFIG_PRECISION) : y_lat;

	const sep = opts?.sep ?? '_';

	return `${lngStr}${sep}${latStr}` as IFormatBlockKey<S>;
}

/**
 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 */
export function _calCoordToBlockIndexCore(current: number, base: number)
{
	return Math.floor((current - base + GLOBAL_GRID_CONFIG_EPSILON) / BLOCK_SIZE);
}

/**
 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 */
export function _calcCoordToBlockIndex({ lng, lat }: IGpsCoordinate): IGpsBlockIndex
{
	const xIdx = _calCoordToBlockIndexCore(lng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const yIdx = _calCoordToBlockIndexCore(lat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
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
export function _calcBlockIndexToCoord({ xIdx, yIdx }: IGpsBlockIndex): IGpsLngLatMin
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
export function calcBlockIdsInRange(range: IGpsLngLatMinMax)
{
	const idBounds = _getBlockIdsInRangeCore(range);

	const matchedBlocks = _detectIdBoundsMatchedBlock(idBounds);

	return {
		idBounds,
		matchedBlocks,
	};
};

export interface IBlockIndexBoundsStartEnd
{
	/** x lng 索引最小值 */
	startX: number;
	/** x lng 索引最大值 */
	endX: number;
	/** y lat 索引最小值 */
	startY: number;
	/** y lat 索引最大值 */
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
}: IGpsLngLatMinMax): IBlockIndexBoundsStartEnd
{
	const startX = _calCoordToBlockIndexCore(minLng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const endX = _calCoordToBlockIndexCore(maxLng - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lng);

	const startY = _calCoordToBlockIndexCore(minLat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	const endY = _calCoordToBlockIndexCore(maxLat - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lat);

	return {
		startX,
		endX,
		startY,
		endY,
	};
}

export function _detectIdBoundsMatchedBlock(idBounds: IBlockIndexBoundsStartEnd)
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

export function _idxBoundsToRange(idBounds: IBlockIndexBoundsStartEnd): IGpsLngLatMinMax
{
	return {
		minLat: _calcBlockIndexToCoordCore(idBounds.startX, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		maxLat: _calcBlockIndexToCoordCore(idBounds.endX, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		minLng: _calcBlockIndexToCoordCore(idBounds.startY, GLOBAL_GRID_CONFIG_ORIGIN.lat),
		maxLng: _calcBlockIndexToCoordCore(idBounds.endY, GLOBAL_GRID_CONFIG_ORIGIN.lat),
	};
}

export function _idxToRange(indices: IGpsBlockIndex): IGpsLngLatMinMax
{
	const { minLng, minLat } = _calcBlockIndexToCoord(indices);

	return {
		minLat,
		maxLat: minLat + BLOCK_SIZE,
		minLng,
		maxLng: minLng + BLOCK_SIZE,
	};
}

export function rangeToBounds(range: IGpsLngLatMinMax): IBounds
{
	return {
		/** 西北角座標 / Northwest corner coordinates */
		northWest: fixCoord({
			lng: range.minLng,
			lat: range.maxLat,
		}),
		/** 東北角座標 / Northeast corner coordinates */
		northEast: fixCoord({
			lng: range.maxLng,
			lat: range.maxLat,
		}),
		/** 西南角座標 / Southwest corner coordinates */
		southWest: fixCoord({
			lng: range.minLng,
			lat: range.minLat,
		}),
		/** 東南角座標 / Southeast corner coordinates */
		southEast: fixCoord({
			lng: range.maxLng,
			lat: range.minLat,
		}),
	}
}

export function boundsToRange(bounds: IBounds): IGpsLngLatMinMax
{
	const { minLng, minLat } = _boundsToLngLatMin(bounds);
	const { maxLng, maxLat } = _boundsToLngLatMax(bounds);

	return {
		minLng,
		maxLng,
		minLat,
		maxLat,
	};
}

/**
 * 計算分流資料夾名稱
 * 邏輯：先算索引，再將索引除以 15 取整數，得到「組索引」
 */
export function calcCoordToBucketIndexAndCoord(coord: IGpsCoordinate)
{
	const blockIndex = _calcCoordToBlockIndex(coord);

	// 計算組索引 (Bucket Index)
	const bucketIndex = _calcBlockIndexToBucketIndex(blockIndex);

	// 為了讓資料夾名稱好讀，我們可以將組索引轉回該組的起始座標
	const bucketCoord = _calcBucketCoordByBucketIndex(bucketIndex);

	return {
		blockIndex,
		bucketIndex,
		bucketCoord,
	};
};

/**
 * 為了讓資料夾名稱好讀，我們可以將組索引轉回該組的起始座標
 */
export function _calcBucketCoordByBucketIndexCore(bucket: number, coord: number)
{
	return coord + bucket * (BLOCK_SIZE * BUCKET_CONFIG_GROUP_SIZE);
}

/**
 * 為了讓資料夾名稱好讀，我們可以將組索引轉回該組的起始座標
 */
export function _calcBucketCoordByBucketIndex(bucket: { bucketX: number, bucketY: number }): IGpsCoordinate
{
	const bucketLng = _calcBucketCoordByBucketIndexCore(bucket.bucketX, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	const bucketLat = _calcBucketCoordByBucketIndexCore(bucket.bucketY, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	return {
		lng: bucketLng,
		lat: bucketLat,
	};
}

/**
 * 計算組索引 (Bucket Index)
 */
export function _calcBlockIndexToBucketIndexCore(idx: number)
{
	return Math.floor(idx / BUCKET_CONFIG_GROUP_SIZE);
}

/**
 * 計算組索引 (Bucket Index)
 */
export function _calcBlockIndexToBucketIndex(blockIndex: IGpsBlockIndex)
{
	return {
		bucketX: _calcBlockIndexToBucketIndexCore(blockIndex.xIdx),
		bucketY: _calcBlockIndexToBucketIndexCore(blockIndex.yIdx),
	};
}

/**
 * 給予左下角點與區塊大小，回傳四個邊角的座標
 */
export function calculateCroodToBounds(crood: IGpsCoordinate)
{
	const indices = _calcCoordToBlockIndex(crood);
	const range = _idxToRange(indices);

	return rangeToBounds(range);
}

/**
 * 給予區塊內「任意座標」，計算該區塊的「中心點」
 */
export function _calculateCenterByAnyPointCore(minLngLat: IGpsLngLatMin)
{
	// 從左下角向中心偏移 (加上半個區塊大小)
	const half = _fixCoordCore(BLOCK_SIZE / 2);

	return fixCoord({
		lng: minLngLat.minLng + half,
		lat: minLngLat.minLat + half
	});
}

/**
 * 給予區塊內「任意座標」，計算該區塊的「中心點」
 */
export function calculateCenterByAnyPoint(anyCoord: IGpsCoordinate)
{
	const minLngLat = calcGlobalBlockIndexAndCoord(anyCoord);

	return _calculateCenterByAnyPointCore(minLngLat);
}

export function _fixCoordCore(coord: number)
{
	return parseFloat(coord.toFixed(GLOBAL_GRID_CONFIG_PRECISION));
}


export function fixCoord(coord: IGpsCoordinate): IGpsCoordinate
{
	return {
		lng: _fixCoordCore(coord.lng),
		lat: _fixCoordCore(coord.lat)
	};
}

export function _boundsToLngLatMin(bounds: IBounds): IGpsLngLatMin
{
	return {
		minLng: bounds.southWest.lng,
		minLat: bounds.southWest.lat,
	}
}

export function _boundsToLngLatMax(bounds: IBounds): IGpsLngLatMax
{
	return {
		maxLng: bounds.northEast.lng,
		maxLat: bounds.northEast.lat,
	}
}

/**
 * 核心：從網格內的「任意座標」推導出完整的網格屬性
 */
export function getGridSpecsFromAnyPoint(anyCoord: IGpsCoordinate)
{
	const indices = _calcCoordToBlockIndex(anyCoord);
	const range = _idxToRange(indices);

	const bounds = rangeToBounds(range);

	const minLngLat = _boundsToLngLatMin(bounds);

	const center = _calculateCenterByAnyPointCore(minLngLat);

	return {
		blockPath: _formatBlockKey(minLngLat.minLng, minLngLat.minLat),
		bounds,
		center,
		indices,
	};
}
