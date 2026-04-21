/**
 * 全球網格通用工具
 * Global grid utilities for geographic data processing.
 *
 * 提供全球通用的座標轉區塊 ID 計算與格式化的共用具。
 * Provides global utilities for coordinate-to-block ID calculation and formatting.
 */
import {
	BLOCK_SIZE,
	BUCKET_CONFIG_GROUP_SIZE,
	GLOBAL_GRID_CONFIG_EPSILON,
	GLOBAL_GRID_CONFIG_FACTOR,
	GLOBAL_GRID_CONFIG_ORIGIN,
	GLOBAL_GRID_CONFIG_PRECISION,
} from './grid-const';
import {
	IBlockIndexBoundsStartEnd,
	IBounds,
	ICoordinateArrayLatLng,
	IFormatBlockKey,
	IGpsBlockIndex,
	IGpsBucketIndex,
	IGpsCoordinate,
	IGpsLngLatMax,
	IGpsLngLatMin,
	IGpsLngLatMinMax,
} from './grid-types';

/**
 * 全球通用：座標轉區塊 ID
 * Global universal: coordinate to block ID
 *
 * 不論給入哪裡的座標，都會自動對齊到 GLOBAL_GRID_CONFIG_ORIGIN 出發的全球網格
 * No matter where coordinates are entered, they will automatically align to the global grid starting from GLOBAL_GRID_CONFIG_ORIGIN
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns 區塊索引與左下角座標 / Block index and bottom-left coordinates
 */
export function calcGlobalBlockIndexAndCoord({ lng, lat }: IGpsCoordinate): IGpsBlockIndex & IGpsLngLatMin
{
	/**
	 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
	 * Core formula: Regardless of positive/negative, floor can correctly find the "minimum boundary" of that block
	 */
	const { xIdx, yIdx } = _calcCoordToBlockIndex({ lng, lat });

	/**
	 * 算出該區塊的左下角座標
	 * Calculate the bottom-left coordinates of that block
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
 * Format block key
 *
 * 將座標轉換為格式化的鍵值字串
 * Converts coordinates to formatted key string
 *
 * @param x_lng - X 座標（經度）/ X coordinate (longitude)
 * @param y_lat - Y 座標（緯度）/ Y coordinate (latitude)
 * @param opts - 選項 / Options
 * @param opts.sep - 分隔符（預設 "_"）/ Separator (default "_")
 * @returns 格式化後的鍵值 / Formatted key
 */
export function _formatBlockKey<S extends string = '_'>(x_lng: number | string, y_lat: number | string, opts?: {
	sep?: S;
	precision?: number;
}): IFormatBlockKey<S>
{
	/** 取得精度，預設使用全局精度配置 / Get precision, default to global precision config */
	const precision = opts?.precision ?? GLOBAL_GRID_CONFIG_PRECISION;

	/** 將數字轉換為固定精度字串 / Convert number to fixed precision string */
	const lngStr = typeof x_lng === 'number' ? x_lng.toFixed(precision) : x_lng;
	const latStr = typeof y_lat === 'number' ? y_lat.toFixed(precision) : y_lat;

	/** 取得分隔符，預設為底線 / Get separator, default to underscore */
	const sep = opts?.sep ?? '_';

	/** 組合為格式化的鍵值字串 / Combine into formatted key string */
	return `${lngStr}${sep}${latStr}` as IFormatBlockKey<S>;
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
export function _calCoordToBlockIndexCore(current: number, base: number)
{
	/**
	 * 使用 epsilon 修正浮點數計算誤差，確保邊界情況正確處理
	 * Uses epsilon to correct floating-point calculation errors, ensuring correct boundary handling
	 */
	return Math.floor((current - base + GLOBAL_GRID_CONFIG_EPSILON) / BLOCK_SIZE);
}

/**
 * 座標轉區塊索引
 * Coordinate to block index
 *
 * 將 GPS 座標轉換為區塊索引
 * Converts GPS coordinates to block index
 *
 * 核心公式：不論正負數，floor 都能正確找到該區塊的「最小值邊界」
 * Core formula: Regardless of positive/negative, floor can correctly find the "minimum boundary" of that block
 *
 * @param anyCrood - GPS 座標 / GPS coordinate
 * @returns 區塊索引 / Block index
 */
export function _calcCoordToBlockIndex(anyCrood: IGpsCoordinate): IGpsBlockIndex
{
	/** 計算經度方向的區塊索引 / Calculate block index for longitude */
	const xIdx = _calCoordToBlockIndexCore(anyCrood.lng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	/** 計算緯度方向的區塊索引 / Calculate block index for latitude */
	const yIdx = _calCoordToBlockIndexCore(anyCrood.lat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	return { xIdx, yIdx };
}

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
export function _calcBlockIndexToCoordCore(idx: number, base: number)
{
	/**
	 * 核心公式：基準座標 + (區塊索引 * 區塊大小)
	 * Core formula: base + (block index * block size)
	 *
	 * 固定精度以確保座標儲存的一致性
	 * Fixed precision ensures consistent coordinate storage
	 */
	return parseFloat((base + idx * BLOCK_SIZE).toFixed(GLOBAL_GRID_CONFIG_PRECISION))
}

/**
 * 區塊索引轉座標
 * Block index to coordinate
 *
 * 將區塊索引轉換為左下角座標
 * Converts block index to bottom-left coordinates
 *
 * @param indices - 區塊索引 / Block index
 * @returns 左下角座標 / Bottom-left coordinates
 */
export function _calcBlockIndexToCoord({ xIdx, yIdx }: IGpsBlockIndex): IGpsLngLatMin
{
	/** 計算經度方向的左下角座標 / Calculate bottom-left coordinate for longitude */
	const minLng = _calcBlockIndexToCoordCore(xIdx, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	/** 計算緯度方向的左下角座標 / Calculate bottom-left coordinate for latitude */
	const minLat = _calcBlockIndexToCoordCore(yIdx, GLOBAL_GRID_CONFIG_ORIGIN.lat);

	return {
		minLng,
		minLat,
	};
}

/**
 * 計算矩形範圍內的區塊 IDs
 * Calculate block IDs within a rectangular range
 *
 * 這個函式保證結果只會是 1, 2, 4 (或更多，取決於 range 大小，但一定是矩形數量)
 * This function guarantees results will only be 1, 2, 4 (or more, depending on range size, but definitely rectangular quantity)
 *
 * @param range - 座標範圍 / Coordinate range
 * @returns 區塊索引邊界與匹配的區塊 / Block index bounds and matched blocks
 */
export function calcBlockIdsInRange(range: IGpsLngLatMinMax)
{
	/** 計算範圍內的區塊索引邊界 / Calculate block index bounds within the range */
	const idBounds = _getBlockIdsInRangeCore(range);

	/** 檢測並產生匹配的區塊鍵值 / Detect and generate matched block keys */
	const matchedBlocks = _detectIdBoundsMatchedBlock(idBounds);

	return {
		idBounds,
		matchedBlocks,
	};
};

/**
 * 計算矩形範圍內的區塊索引邊界（核心函式）
 * Calculate block index bounds within rectangular range (core function)
 *
 * 這個函式保證結果只會是 1, 2, 4 (或更多，取決於 range 大小，但一定是矩形數量)
 * This function guarantees results will only be 1, 2, 4
 * (or more, depending on range size, but definitely rectangular quantity)
 *
 * @param range - 座標範圍 / Coordinate range
 * @returns 區塊索引邊界 / Block index bounds
 */
export function _getBlockIdsInRangeCore({
	minLng,
	minLat,
	maxLng,
	maxLat,
}: IGpsLngLatMinMax): IBlockIndexBoundsStartEnd
{
	/** 計算經度方向的起始和結束索引 / Calculate start and end index for longitude */
	const startX = _calCoordToBlockIndexCore(minLng, GLOBAL_GRID_CONFIG_ORIGIN.lng);
	/**
	 * 使用 epsilon 確保最大值邊界不包含在下一個區塊
	 * Use epsilon to ensure max boundary is not included in next block
	 */
	const endX = _calCoordToBlockIndexCore(maxLng - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lng);

	/** 計算緯度方向的起始和結束索引 / Calculate start and end index for latitude */
	const startY = _calCoordToBlockIndexCore(minLat, GLOBAL_GRID_CONFIG_ORIGIN.lat);
	const endY = _calCoordToBlockIndexCore(maxLat - GLOBAL_GRID_CONFIG_EPSILON, GLOBAL_GRID_CONFIG_ORIGIN.lat);

	return {
		startX,
		endX,
		startY,
		endY,
	};
}

/**
 * 檢測並產生匹配的區塊鍵值
 * Detect and generate matched block keys
 *
 * 遍歷區塊邊界範圍內的所有區塊索引
 * Iterates through all block indices within the bounds range
 *
 * @param idBounds - 區塊索引邊界 / Block index bounds
 * @returns 匹配的區塊鍵值陣列 / Array of matched block keys
 */
export function _detectIdBoundsMatchedBlock(idBounds: IBlockIndexBoundsStartEnd)
{
	const matchedBlocks: ReturnType<typeof _formatBlockKey>[] = [];

	/** 遍歷經度方向的所有區塊 / Iterate through all blocks in longitude direction */
	for (let x = idBounds.startX; x <= idBounds.endX; x++)
	{
		/** 遍歷緯度方向的所有區塊 / Iterate through all blocks in latitude direction */
		for (let y = idBounds.startY; y <= idBounds.endY; y++)
		{
			/** 計算每個區塊的左下角座標 / Calculate bottom-left coordinate for each block */
			const minLng = _calcBlockIndexToCoordCore(x, GLOBAL_GRID_CONFIG_ORIGIN.lng);
			const minLat = _calcBlockIndexToCoordCore(y, GLOBAL_GRID_CONFIG_ORIGIN.lat);
			matchedBlocks.push(_formatBlockKey(minLng, minLat));
		}
	}

	return matchedBlocks;
}

/**
 * 區塊索引邊界轉座標範圍
 * Block index bounds to coordinate range
 *
 * 將區塊索引邊界轉換為座標範圍
 * Converts block index bounds to coordinate range
 *
 * @param idBounds - 區塊索引邊界 / Block index bounds
 * @returns 座標範圍 / Coordinate range
 */
export function _idxBoundsToRange(idBounds: IBlockIndexBoundsStartEnd): IGpsLngLatMinMax
{
	/**
	 * 將邊界起始點轉為最小座標
	 * 將邊界結束點轉為最大座標
	 *
	 * Convert boundary start to min coordinates
	 * Convert boundary end to max coordinates
	 */
	return {
		minLat: _calcBlockIndexToCoordCore(idBounds.startX, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		maxLat: _calcBlockIndexToCoordCore(idBounds.endX, GLOBAL_GRID_CONFIG_ORIGIN.lng),
		minLng: _calcBlockIndexToCoordCore(idBounds.startY, GLOBAL_GRID_CONFIG_ORIGIN.lat),
		maxLng: _calcBlockIndexToCoordCore(idBounds.endY, GLOBAL_GRID_CONFIG_ORIGIN.lat),
	};
}

/**
 * 區塊索引轉座標範圍
 * Block index to coordinate range
 *
 * 將區塊索引轉換為座標範圍
 * Converts block index to coordinate range
 *
 * @param indices - 區塊索引 / Block index
 * @returns 座標範圍 / Coordinate range
 */
export function _idxToRange(indices: IGpsBlockIndex): IGpsLngLatMinMax
{
	/** 取得區塊的左下角座標 / Get block's bottom-left coordinate */
	const { minLng, minLat } = _calcBlockIndexToCoord(indices);

	return {
		minLat,
		/** 加上區塊大小得到最大緯度 / Add block size to get max latitude */
		maxLat: minLat + BLOCK_SIZE,
		minLng,
		/** 加上區塊大小得到最大經度 / Add block size to get max longitude */
		maxLng: minLng + BLOCK_SIZE,
	};
}

/**
 * 座標轉座標範圍（可指定區塊數量）
 * Coordinate to coordinate range (with configurable block count)
 *
 * 將座標轉換為包含指定數量區塊的座標範圍
 * Converts coordinate to range containing specified number of blocks
 *
 * @param minLngLat - 左下角座標 / Bottom-left coordinate
 * @param bucketSize - 區塊數量（預設 1）/ Block count (default 1)
 * @returns 座標範圍 / Coordinate range
 */
export function _croodToRange(minLngLat: IGpsLngLatMin, bucketSize = 1): IGpsLngLatMinMax
{
	const { minLng, minLat } = minLngLat;

	return {
		minLat,
		/** 根據區塊數量計算最大範圍 / Calculate max range based on block count */
		maxLat: minLat + BLOCK_SIZE * bucketSize,
		minLng,
		maxLng: minLng + BLOCK_SIZE * bucketSize,
	};
}

/**
 * 座標範圍轉邊界
 * Coordinate range to bounds
 *
 * 將座標範圍轉換為四角座標邊界
 * Converts coordinate range to four-corner bounds
 *
 * @param range - 座標範圍 / Coordinate range
 * @returns 四角座標邊界 / Four corner coordinates bounds
 */
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

/**
 * 邊界轉座標範圍
 * Bounds to coordinate range
 *
 * 將四角座標邊界轉換為座標範圍
 * Converts four-corner bounds to coordinate range
 *
 * @param bounds - 四角座標邊界 / Four corner coordinates bounds
 * @returns 座標範圍 / Coordinate range
 */
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
 * Calculate shunting/folder name
 *
 * 邏輯：先算索引，再將索引除以 15 取整數，得到「組索引」
 * Logic: First calculate index, then divide index by 15 and take integer to get "group index"
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns 區塊索引、組索引、組座標 / Block index, bucket index, bucket coordinates
 */
export function calcCoordToBucketIndexAndCoord(coord: IGpsCoordinate)
{
	/** 計算區塊索引 / Calculate block index */
	const blockIndex = _calcCoordToBlockIndex(coord);

	/** 計算組索引 (Bucket Index) / Calculate group index (Bucket Index) */
	const bucketIndex = _calcBlockIndexToBucketIndex(blockIndex);

	/**
	 * 為了讓資料夾名稱好讀，我們可以將組索引轉回該組的起始座標
	 * For readability, we can convert group index back to the starting coordinates of that group
	 */
	const bucketCoord = _calcBucketCoordByBucketIndex(bucketIndex);

	return {
		blockIndex,
		bucketIndex,
		bucketCoord,
	};
};

/**
 * 計算分流組起始座標（單一維度）
 * Calculate bucket group starting coordinates (single dimension)
 *
 * 將區塊索引轉換為區塊分流組的起始座標
 * Converts block index to bucket group's starting coordinates
 *
 * @param bucket - 分流組索引 / Bucket index
 * @param coord - 基準座標 / Base coordinate
 * @returns 分流組起始座標 / Bucket starting coordinate
 */
export function _calcBucketCoordByBucketIndexCore(bucket: number, coord: number)
{
	/**
	 * 計算公式：基準座標 + 組索引 * (區塊大小 * 區塊組數量)
	 * Calculation: base coordinate + group index * (block size * bucket group size)
	 */
	return coord + bucket * (BLOCK_SIZE * BUCKET_CONFIG_GROUP_SIZE);
}

/**
 * 計算組起始座標
 * Calculate group starting coordinates
 *
 * 將組索引轉回該組的起始座標
 * Converts group index back to the starting coordinates of that group
 *
 * @param bucket - 組索引 / Bucket index
 * @returns 組起始座標 / Group starting coordinates
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
 * 計算分流組索引（單一維度）(Bucket Index)
 * Calculate group index (single dimension) (Bucket Index)
 *
 * 將區塊索引除以區塊組大小（15）取整數
 * Divides block index by bucket group size (15) and takes integer
 *
 * @param idx - 區塊索引 / Block index
 * @returns 分流組索引 / Bucket index
 */
export function _calcBlockIndexToBucketIndexCore(idx: number)
{
	/** 使用 floor 取整數，確保正確的組別計算 / Use floor to get integer group index */
	return Math.floor(idx / BUCKET_CONFIG_GROUP_SIZE);
}

/**
 * 計算分流組索引 (Bucket Index)
 * Calculate group index
 *
 * 將區塊索引除以 BUCKET_CONFIG_GROUP_SIZE (15) 取整數
 * Divides block index by BUCKET_CONFIG_GROUP_SIZE (15) and takes integer
 *
 * @param blockIndex - 區塊索引 / Block index
 * @returns 組索引 / Bucket index
 */
export function _calcBlockIndexToBucketIndex(blockIndex: IGpsBlockIndex): IGpsBucketIndex
{
	return {
		bucketX: _calcBlockIndexToBucketIndexCore(blockIndex.xIdx),
		bucketY: _calcBlockIndexToBucketIndexCore(blockIndex.yIdx),
	};
}

/**
 * 座標轉邊界
 * Coordinate to bounds
 *
 * 給予左下角點與區塊大小，回傳四個邊角的座標
 * Given bottom-left point and block size, returns four corner coordinates
 *
 * @param crood - 左下角座標 / Bottom-left coordinate
 * @returns 四角座標邊界 / Four corner bounds
 */
export function calculateCroodToBounds(crood: IGpsCoordinate)
{
	/** 取得區塊索引 / Get block index */
	const indices = _calcCoordToBlockIndex(crood);
	/** 取得座標範圍 / Get coordinate range */
	const range = _idxToRange(indices);

	/** 轉換為邊界 / Convert to bounds */
	return rangeToBounds(range);
}

/**
 * 計算區塊中心點（從左下角座標）
 * Calculate block center (from bottom-left coordinates)
 *
 * 從左下角向中心偏移（加上半個區塊大小）
 * Offset from bottom-left to center (add half block size)
 *
 * @param minLngLat - 左下角座標 / Bottom-left coordinates
 * @returns 中心點座標 / Center coordinates
 */
export function _calculateCenterByAnyPointCore(minLngLat: IGpsLngLatMin)
{
	/** 從左下角向中心偏移 (加上半個區塊大小) / Offset from bottom-left to center (add half block size) */
	const half = _fixCoordCore(BLOCK_SIZE / 2);

	return fixCoord({
		lng: minLngLat.minLng + half,
		lat: minLngLat.minLat + half,
	});
}

/**
 * 計算區塊中心點（從任意座標）
 * Calculate block center (from any coordinate)
 *
 * 給予區塊內「任意座標」，計算該區塊的「中心點」
 * Given "any coordinate" within a block, calculate the "center" of that block
 *
 * @param anyCoord - 任意座標 / Any coordinate
 * @returns 區塊中心點座標 / Block center coordinates
 */
export function calculateCenterByAnyPoint(anyCoord: IGpsCoordinate)
{
	const minLngLat = calcGlobalBlockIndexAndCoord(anyCoord);

	return _calculateCenterByAnyPointCore(minLngLat);
}

/**
 * 座標修正核心（單一數值）
 * Coordinate fix core (single value)
 *
 * 將座標修正到指定精度
 * Fixes coordinate to specified precision
 *
 * @param coord - 座標值 / Coordinate value
 * @param precision - 精度 / Precision
 * @returns 修正後的座標值 / Fixed coordinate value
 */
export function _fixCoordCore(coord: number, precision?: number)
{
	/** 使用 toFixed 固定精度，再.parseFloat 確保數字類型 / Use toFixed, then parseFloat to ensure number type */
	return parseFloat(coord.toFixed(precision ?? GLOBAL_GRID_CONFIG_PRECISION));
}

/**
 * 從字串修正座標核心
 * Fix coordinate from string core
 *
 * 將字串或數字轉換為修正後的座標
 * Converts string or number to fixed coordinate
 *
 * @param coord - 座標（數字或字串）/ Coordinate (number or string)
 * @param precision - 精度（可選）/ Precision (optional)
 * @returns 修正後的座標值 / Fixed coordinate value
 */
export function _fixCoordFromStringCore(coord: number | string, precision?: number)
{
	return _fixCoordCore(Number(coord), precision);
}

/**
 * 座標修正
 * Coordinate fix
 *
 * 將 GPS 座標修正到指定精度
 * Fixes GPS coordinates to specified precision
 *
 * @param coord - GPS 座標 / GPS coordinate
 * @returns 修正後的座標 / Fixed coordinates
 */
export function fixCoord(coord: IGpsCoordinate): IGpsCoordinate
{
	return {
		lng: _fixCoordCore(coord.lng),
		lat: _fixCoordCore(coord.lat),
	};
}

/**
 * 邊界轉最小經緯度
 * Bounds to min longitude/latitude
 *
 * 從邊界取得最小座標（西南角）
 * Gets minimum coordinates from bounds (southwest corner)
 *
 * @param bounds - 四角座標邊界 / Four corner bounds
 * @returns 最小經緯度 / Min longitude/latitude
 */
export function _boundsToLngLatMin(bounds: IBounds): IGpsLngLatMin
{
	/** 使用西南角作為最小座標 / Use southwest corner as minimum coordinates */
	return {
		minLng: bounds.southWest.lng,
		minLat: bounds.southWest.lat,
	}
}

/**
 * 邊界轉最大經緯度
 * Bounds to max longitude/latitude
 *
 * 從邊界取得最大座標（東北角）
 * Gets maximum coordinates from bounds (northeast corner)
 *
 * @param bounds - 四角座標邊界 / Four corner bounds
 * @returns 最大經緯度 / Max longitude/latitude
 */
export function _boundsToLngLatMax(bounds: IBounds): IGpsLngLatMax
{
	/** 使用東北角作為最大座標 / Use northeast corner as maximum coordinates */
	return {
		maxLng: bounds.northEast.lng,
		maxLat: bounds.northEast.lat,
	}
}

/**
 * 從任意座標取得完整網格屬性
 * Get complete grid properties from any coordinate
 *
 * 核心：從網格內的「任意座標」推導出完整的網格屬性
 * Core: Derives complete grid properties from "any coordinate" within the grid
 *
 * @param anyCoord - 任意座標 / Any coordinate
 * @returns 網格屬性（路徑、邊界、中心、索引）/ Grid properties (path, bounds, center, indices)
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

/**
 * 從任意座標推導其所屬 Bucket (L1) 的完整屬性
 * Derive complete bucket properties from any coordinate
 *
 * 取得區塊組（L1 層級）的完整屬性
 * Gets complete properties for the bucket group (L1 level)
 *
 * @param anyCoord - 任意座標 / Any coordinate
 * @returns 區塊組屬性 / Bucket properties
 */
export function getBucketSpecsFromAnyPoint(anyCoord: IGpsCoordinate)
{
	/**
	 * 計算區塊組資訊（包含 L1 的總跨度 0.3度）
	 * Calculate bucket info (L1 span = 0.3 degrees)
	 */
	const { bucketIndex, bucketCoord, blockIndex } = calcCoordToBucketIndexAndCoord(anyCoord);

	/**
	 * 根據區塊組大小計算座標範圍
	 * Calculate coordinate range based on bucket size
	 */
	const bucketRange = _croodToRange({
		minLng: bucketCoord.lng,
		minLat: bucketCoord.lat,
	}, BUCKET_CONFIG_GROUP_SIZE);

	/** 將座標範圍轉換為邊界 / Convert range to bounds */
	const bucketBounds = rangeToBounds(bucketRange);

	return {
		bucketPath: _formatBlockKey(bucketCoord.lng, bucketCoord.lat, { sep: '/' }),
		bucketIndex,
		bucketBounds,
		blockIndex,
	};
}

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
export function _sortCompByBucket(a: IGpsCoordinate, b: IGpsCoordinate)
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
export function _sortCompByBucketCore(bucketIndexA: IGpsBucketIndex, bucketIndexB: IGpsBucketIndex)
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
export function _sortCompByBlock(a: IGpsCoordinate, b: IGpsCoordinate)
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
export function _sortCompByBlockCore(blockIndexA: IGpsBlockIndex, blockIndexB: IGpsBlockIndex)
{
	/** 比較區塊索引 Y（由南往北）/ Compare Y (south to north) */
	if (blockIndexA.yIdx !== blockIndexB.yIdx)
	{
		return blockIndexA.yIdx - blockIndexB.yIdx;
	}

	/** 比較區塊索引 X（由西往東）/ Compare X (west to east) */
	return blockIndexA.xIdx - blockIndexB.xIdx;
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
export function _sortCompByCoordinateCore(coordA: IGpsCoordinate, coordB: IGpsCoordinate)
{
	/** 轉換為整數座標 / Convert to integer coordinates */
	const intCoordLatA = _toIntCoord(coordA.lat);
	const intCoordLatB = _toIntCoord(coordB.lat);

	/** 先比較緯度 / Compare latitude first */
	if (intCoordLatA !== intCoordLatB)
	{
		return intCoordLatA - intCoordLatB;
	}

	/** 比較座標 (由西往東) */
	const intCoordLngA = _toIntCoord(coordA.lng);
	const intCoordLngB = _toIntCoord(coordB.lng);

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
 * @param a - 比較點 A
 * @param b - 比較點 B
 * @returns 排序結果 (-1, 0, 1)
 */
export function _sortCompByBucketAndBlock(a: IGpsCoordinate, b: IGpsCoordinate)
{
	const gridA = calcCoordToBucketIndexAndCoord(a);
	const gridB = calcCoordToBucketIndexAndCoord(b);

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
	return _sortCompByCoordinateCore(a, b)
}

/**
 * 將經緯度轉為「整數座標」
 * 使用整數化後的座標比較，避免浮點數誤差導致的排序抖動
 */
export function _toIntCoord(val: number): number
{
	return Math.floor(val * GLOBAL_GRID_CONFIG_FACTOR);
}

/**
 * 將整數座標還原為「浮點經緯度」
 * 注意：此函數僅用於還原座標，不應用於排序比較。
 * 並且並非真實原始座標，僅為近似值
 */
export function _fromIntCoord(intVal: number): number
{
	return intVal / GLOBAL_GRID_CONFIG_FACTOR;
}

/**
 * 標準十進位格式 (Decimal Degrees, DD)
 * 格式：[Lat, Lng] (符合 Google Maps 搜尋習慣)
 * 範例："25.0200, 121.4800"
 */
export function formatToDD(coord: IGpsCoordinate, precision = 6): string
{
	return `${coord.lat.toFixed(precision)}, ${coord.lng.toFixed(precision)}`;
}

export function _formatToDDMCore(val: number, pos: string, neg: string)
{
	const abs = Math.abs(val);
	const deg = Math.floor(abs);
	const min = ((abs - deg) * 60).toFixed(3);
	const dir = val >= 0 ? pos : neg;
	return `${deg}° ${min}' ${dir}`;
}

/**
 * 度分格式 (Degrees Decimal Minutes, DDM)
 * 格式：Degrees° Minutes' Direction
 * 範例："25° 01.200' N, 121° 28.800' E"
 */
export function formatToDDM(coord: IGpsCoordinate): string
{

	return `${_formatToDDMCore(coord.lat, 'N', 'S')}, ${_formatToDDMCore(coord.lng, 'E', 'W')}`;
}

export function _formatToDMSCore(val: number, pos: string, neg: string)
{
	const abs = Math.abs(val);
	const deg = Math.floor(abs);
	const minVal = (abs - deg) * 60;
	const min = Math.floor(minVal);
	const sec = ((minVal - min) * 60).toFixed(1);
	const dir = val >= 0 ? pos : neg;
	return `${deg}° ${min}' ${sec}" ${dir}`;
}

/**
 * 度分秒格式 (Degrees Minutes Seconds, DMS)
 * 格式：Degrees° Minutes' Seconds" Direction
 * 範例："25° 01' 12.0\" N, 121° 28' 48.0\" E"
 */
export function formatToDMS(coord: IGpsCoordinate): string
{

	return `${_formatToDMSCore(coord.lat, 'N', 'S')}, ${_formatToDMSCore(coord.lng, 'E', 'W')}`;
}

/**
 * 注意: y lat 在前, x lng 在後
 * @param {[lat: number, lng: number]} positionLatLng
 * @returns {IGpsCoordinate}
 */
export function wrapCoordinateFromArray(positionLatLng: ICoordinateArrayLatLng): IGpsCoordinate
{
	return {
		lng: positionLatLng[1],
		lat: positionLatLng[0],
	};
}

/**
 * 注意: y lat 在前, x lng 在後
 */
export function wrapLatLngArrayFromCoordinate(coord: IGpsCoordinate): ICoordinateArrayLatLng
{
	return [coord.lat, coord.lng];
}

export function wrapCoordinate(lng: number, lat: number): IGpsCoordinate
{
	return {
		lng,
		lat,
	};
}

export function wrapLngLatMin(minLng: number, minLat: number): IGpsLngLatMin
{
	return {
		minLng,
		minLat,
	};
}

export function validateCoordinate(coord: IGpsCoordinate): asserts coord is IGpsCoordinate
{
	if (coord.lat < -90 || coord.lat > 90)
	{
		throw new RangeError(`無效的緯度: ${coord.lat}。緯度應介於 -90 與 90 之間。`);
	}
	if (coord.lng < -180 || coord.lng > 180)
	{
		throw new RangeError(`無效的經度: ${coord.lng}。經度應介於 -180 與 180 之間。`);
	}
}
