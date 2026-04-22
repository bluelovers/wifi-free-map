import { IGeoBlockIndex, IGeoBucketGridIndex, IGeoCoord } from '@/lib/utils/grid/grid-types';
import { calcCoordToBucketIndexAndCoord } from '@/lib/utils/grid/grid-utils-global';
import { _toInternalCoordIntScalar } from '@/lib/utils/geo/geo-transform';

/**
 * 比較分流索引（座標版本） (由南往北) -> (由西往東)
 * Compare bucket index (coordinate version)
 *
 * 比較兩個座標所屬的區塊組索引
 * Compare bucket indices of two coordinates
 *
 * @param a - 座標 A / Coordinate A
 * @param b - 座標 B / Coordinate B
 * @returns 排序結果 / Sort result
 */
export function _sortCompByBucket(a: IGeoCoord, b: IGeoCoord)
{
	/** 取得各自的區塊組資訊 / Get bucket info for each coordinate */
	const gridA = calcCoordToBucketIndexAndCoord(a);
	const gridB = calcCoordToBucketIndexAndCoord(b);

	/** 呼叫核心比較函式 / Call core compare function */
	return _sortCompByBucketCore(gridA.bucketIndex, gridB.bucketIndex);
}

/**
 * 比較分流索引核心 (由南往北) -> (由西往東)
 * Compare bucket index core
 *
 * 先比較 Y（緯度方向，由南往北），再比較 X（經度方向，由西往東）
 * First compare Y (latitude, south to north), then X (longitude, west to east)
 *
 * @param bucketIndexA - 區塊組索引 A / Bucket index A
 * @param bucketIndexB - 區塊組索引 B / Bucket index B
 * @returns 排序結果 / Sort result
 */
export function _sortCompByBucketCore(bucketIndexA: IGeoBucketGridIndex, bucketIndexB: IGeoBucketGridIndex)
{
	/** 比較分流索引 Y（由南往北）/ Compare Y (south to north) */
	if (bucketIndexA.bucketY !== bucketIndexB.bucketY)
	{
		return bucketIndexA.bucketY - bucketIndexB.bucketY;
	}

	/** 比較分流索引 X（由西往東）/ Compare X (west to east) */
	if (bucketIndexA.bucketX !== bucketIndexB.bucketX)
	{
		return bucketIndexA.bucketX - bucketIndexB.bucketX;
	}

	return 0;
}

/**
 * 比較區塊索引 (由南往北) -> (由西往東)
 * Compare block index (coordinate version)
 *
 * 比較兩個座標所屬的區塊索引
 * Compare block indices of two coordinates
 *
 * @param a - 座標 A / Coordinate A
 * @param b - 座標 B / Coordinate B
 * @returns 排序結果 / Sort result
 */
export function _sortCompByBlock(a: IGeoCoord, b: IGeoCoord)
{
	/** 取得各自的區塊組資訊 / Get bucket info for each coordinate */
	const gridA = calcCoordToBucketIndexAndCoord(a);
	const gridB = calcCoordToBucketIndexAndCoord(b);

	/** 呼叫核心比較函式 / Call core compare function */
	return _sortCompByBlockCore(gridA.blockIndex, gridB.blockIndex);
}

/**
 * 比較區塊索引核心 (由南往北) -> (由西往東)
 * Compare block index core
 *
 * 先比較 Y（緯度方向），再比較 X（經度方向）
 * First compare Y (latitude), then X (longitude)
 *
 * @param blockIndexA - 區塊索引 A / Block index A
 * @param blockIndexB - 區塊索引 B / Block index B
 * @returns 排序結果 / Sort result
 */
export function _sortCompByBlockCore(blockIndexA: IGeoBlockIndex, blockIndexB: IGeoBlockIndex)
{
	/** 比較區塊索引 Y（由南往北）/ Compare Y (south to north) */
	if (blockIndexA.yLatIdx !== blockIndexB.yLatIdx)
	{
		return blockIndexA.yLatIdx - blockIndexB.yLatIdx;
	}

	/** 比較區塊索引 X（由西往東）/ Compare X (west to east) */
	return blockIndexA.xLngIdx - blockIndexB.xLngIdx;
}

/**
 * 比較座標 (最細微權重) (由南往北) -> (由西往東)
 * 使用整數化後的座標比較，避免浮點數誤差導致的排序抖動
 * Uses integer-based coordinate comparison to avoid floating-point sorting jitter
 *
 * @param coordA - 座標 A / Coordinate A
 * @param coordB - 座標 B / Coordinate B
 * @returns 排序結果 / Sort result
 */
export function _sortCompByCoordinateCore(coordA: IGeoCoord, coordB: IGeoCoord)
{
	/** 轉換為整數座標 / Convert to integer coordinates */
	const intCoordLatA = _toInternalCoordIntScalar(coordA.lat);
	const intCoordLatB = _toInternalCoordIntScalar(coordB.lat);

	/** 先比較緯度 / Compare latitude first */
	if (intCoordLatA !== intCoordLatB)
	{
		return intCoordLatA - intCoordLatB;
	}

	/** 比較座標 (由西往東) */
	const intCoordLngA = _toInternalCoordIntScalar(coordA.lng);
	const intCoordLngB = _toInternalCoordIntScalar(coordB.lng);

	/** 比較座標 (由南往北) */
	return intCoordLngA - intCoordLngB;
}

/**
 * 比較分流索引 (由南往北) -> (由西往東)
 * -> 比較區塊索引 (由南往北) -> (由西往東)
 *
 * 空間網格層次排序算法 (Spatial Grid Hierarchical Sort)
 *
 * [重要：關於座標跳躍現象]
 * 為了極大化寫入效率，排序優先級為：L1 Bucket (分流資料夾) > L0 Block (區塊檔案) > 原始座標。
 *
 * 當座標跨越 Bucket 邊界時，會出現緯度跳躍現象（例如：121.3 桶的點永遠排在 121.2 桶之後）。
 * 這是預期行為，旨在對齊實體磁碟目錄結構。
 *
 * 由於第一優先權是「資料夾索引」，這會導致在視覺上經緯度可能出現「非線性跳躍」。
 * 例如：
 * 1. 枋山 (22.19°): 落在 Bucket_A，其索引較小，故排在前面。
 * 2. 恆春 (21.94°): 落在 Bucket_B，其索引較大，故排在後面。
 *
 * 這種設計的目的是為了「切割資料效率」，
 * 確保同一資料夾與同一檔案的資料在記憶體中是連續的，
 * 從而最小化檔案系統的 I/O 開關次數。
 *
 * @example
 * 萬華 (121.48) 與 枋山 (120.68) 的排序由各自所屬的 0.3° 桶索引決定。
 *
 * @param coordA - 比較點 A
 * @param coordB - 比較點 B
 * @returns 排序結果 (-1, 0, 1)
 */
export function _sortCompByBucketAndBlock(coordA: IGeoCoord, coordB: IGeoCoord)
{
	const gridA = calcCoordToBucketIndexAndCoord(coordA);
	const gridB = calcCoordToBucketIndexAndCoord(coordB);

	/**
	 * 比較分流索引
	 * 注意：若 Bucket 不同，將以此為準進行分桶排序，不考慮跨 Bucket 的經緯度順序
	 */
	let cmp = _sortCompByBucketCore(gridA.bucketIndex, gridB.bucketIndex);

	if (cmp !== 0)
	{
		return cmp;
	}

	/**
	 * 比較區塊索引
	 * 在同一個資料夾內，確保按區塊順序排列
	 */
	cmp = _sortCompByBlockCore(gridA.blockIndex, gridB.blockIndex);

	if (cmp !== 0)
	{
		return cmp;
	}

	/**
	 * 比較座標 (最細微權重) (由南往北) -> (由西往東)
	 * 使用整數化後的座標比較，避免浮點數誤差導致的排序抖動
	 */
	return _sortCompByCoordinateCore(coordA, coordB)
}
