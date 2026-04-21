/**
 * 資料集類型列舉
 * Dataset type enumeration
 *
 * 用於識別不同類型的地理資料集
 * Used to identify different types of geographic datasets
 */
export enum EnumDatasetType
{
	/** WiFi 熱點 / WiFi hotspot */
	WIFI = "wifi",
	/** 充電站 / Charging station */
	CHARGING = "charging",
}

/**
 * 區塊行列起止索引
 * Block row/col start/end indices
 *
 * 用於描述網格區塊的範圍
 * Used to describe the range of grid blocks
 */
export interface IGpsRowColStartEnd
{
	/** X 方向（經度）起始索引 / X direction (longitude) start index */
	startX: number;
	/** X 方向（經度）結束索引 / X direction (longitude) end index */
	endX: number;
	/** Y 方向（緯度）起始索引 / Y direction (latitude) start index */
	startY: number;
	/** Y 方向（緯度）結束索引 / Y direction (latitude) end index */
	endY: number;
}

/**
 * 經緯度最小值介面
 * Longitude/latitude minimum interface
 */
export interface IGpsLngLatMin
{
	/** x lng 經度最小值 / Minimum longitude */
	minLng: number;
	/** y lat 緯度最小值 / Minimum latitude */
	minLat: number;
}

/**
 * 經緯度最大值介面
 * Longitude/latitude maximum interface
 */
export interface IGpsLngLatMax
{
	/** x lng 經度最大值 / Maximum longitude */
	maxLng: number;
	/** y lat 緯度最大值 / Maximum latitude */
	maxLat: number;
}

/**
 * 經緯度範圍介面（最小值 + 最大值）
 * Longitude/latitude range interface (min + max)
 */
export interface IGpsLngLatMinMax extends IGpsLngLatMin, IGpsLngLatMax
{

}

/**
 * 區塊索引
 * Block index
 *
 * 用於識別網格系統中的特定區塊
 * Used to identify specific blocks in the grid system
 */
export interface IGpsBlockIndex
{
	/** X lng 方向索引（經度）/ X direction index (longitude) */
	xIdx: number;
	/** Y lat 方向索引（緯度）/ Y direction index (latitude) */
	yIdx: number;
}

/**
 * GPS 座標介面
 * GPS coordinate interface
 *
 * 描述地理座標點
 * Describes geographic coordinate point
 */
export interface IGpsCoordinate
{
	/** X 座標（經度）/ X coordinate (longitude) */
	lng: number;
	/** Y 座標（緯度）/ Y coordinate (latitude) */
	lat: number;
}

/**
 * 統一格式的區塊邊界介面
 * Unified grid bounds interface
 *
 * 描述區塊的四角座標
 * Describes the four corner coordinates of a block
 */
export interface IBounds
{
	/** (0,1) 西北角座標 / Northwest corner coordinates */
	northWest: IGpsCoordinate;
	/** (1,1) 東北角座標 / Northeast corner coordinates */
	northEast: IGpsCoordinate;
	/** (0,0) 西南角座標 / Southwest corner coordinates */
	southWest: IGpsCoordinate;
	/** (1,0) 東南角座標 / Southeast corner coordinates */
	southEast: IGpsCoordinate;
}

/**
 * 資料集項目介面
 * Dataset entry interface
 *
 * 描述單一區塊內的資料集項目
 * Describes dataset entry within a single block
 */
export interface IDatasetEntry
{
	/** 資料類型檔案路徑 / Data type file path */
	fileName: string;
	/** 該區塊內的資料筆數 / Number of items in this block */
	// count: number;
}

/**
 * 資料集記錄（按類型分）
 * Dataset record (by type)
 *
 * 使用 EnumDatasetType 作為 key
 * Uses EnumDatasetType as key
 */
export type IDataset = Record<EnumDatasetType, IDatasetEntry>;

/**
 * 統一格式的區塊介面
 * Unified grid block interface
 *
 * 描述完整的地圖區塊資訊
 * Describes complete map block information
 */
export interface IGridBlock extends IGpsCenterBounds
{
	/** 區塊檔名（格式：經度_緯度.json）/ Block file name */
	fileName: string;
	/** 資料集（依資料類型分）/ Dataset (by data type) */
	dataset: IDataset;
	/** 共享位置字串陣列 / Shared location strings */
	locations: string[];
}

/**
 * 區塊 V2 介面
 * Block V2 interface
 *
 * 使用 blockPath 而非 fileName
 * Uses blockPath instead of fileName
 */
export interface IGridBlockV2 extends IGpsCenterBounds
{
	/** 區塊路徑（格式：經度_緯度）/ Block path */
	blockPath: string;
	/** 資料集（依資料類型分）/ Dataset (by data type) */
	dataset: IDataset;
	/** 共享位置字串陣列 / Shared location strings */
	locations: string[];
}

/**
 * 區塊聚合器內部資料結構
 * Block aggregator internal data structure
 *
 * 用於區塊聚合器的內部資料處理
 * Used for internal data processing in block aggregator
 */
export interface IBlockData extends IGpsCenterBounds
{
	/** 位置字串集合 / Location string set */
	locations: Set<string>;
	/** 資料集 / Dataset */
	dataset: IDataset;
}

/**
 * 區塊中心點與邊界介面
 * Block center and bounds interface
 *
 * 描述區塊的中心點座標與邊界範圍
 * Describes block center coordinates and boundary range
 */
export interface IGpsCenterBounds
{
	/** 區塊中心點座標 / Block center coordinates */
	center: IGpsCoordinate;
	/** 區塊邊界座標 / Block boundary coordinates */
	bounds: IBounds;
}

/**
 * 區塊座標資料結構
 * Block coordinate data structure
 *
 * 用於描述區塊的索引、中心點與邊界資訊
 * Used to describe block index, center, and boundary information
 */
export interface IBlockCoordinate extends IGpsCenterBounds, IGpsBlockIndex
{
	/**
	 * 用於查詢 grid-index.json 的 key (lng_lat)
	 * Key for querying grid-index.json (lng_lat format)
	 */
	lngLat: string;
}

/**
 * 資料項目介面
 * Data entry interface
 *
 * 描述包含座標的資料項目
 * Describes data entry with coordinates
 */
export interface IDataEntry extends IGpsCoordinate
{
	/** 地址（可選）/ Address (optional) */
	address?: string;
}

/**
 * 位置資訊介面
 * Location information interface
 *
 * 從地址解析出的結構化位置資訊
 * Structured location information parsed from address
 */
export interface ILocationInfo
{
	/** 郵遞區號 / Zip code */
	zipCode: string;
	/** 縣市 / City */
	city: string;
	/** 行政區 / District */
	district: string;
	/** 路名 / Road */
	road: string;
}

/**
 * 格式化區塊鍵值類型
 * Format block key type
 *
 * @example IFormatBlockKey<'_'> = "121.2200_24.9200"
 * @example IFormatBlockKey<'/'> = "lng_121.20/lat_24.90"
 */
export type IFormatBlockKey<S extends string = '_'> = `${number}${S}${number}`;

/**
 * 區塊索引邊界起止介面
 * Block index bounds start/end interface
 */
export interface IBlockIndexBoundsStartEnd
{
	/** X lng 方向（經度）索引最小值 / X direction (longitude) index minimum */
	startX: number;
	/** X lng 方向（經度）索引最大值 / X direction (longitude) index maximum */
	endX: number;
	/** Y lat 方向（緯度）索引最小值 / Y direction (latitude) index minimum */
	startY: number;
	/** Y lat 方向（緯度）索引最大值 / Y direction (latitude) index maximum */
	endY: number;
}

/**
 * 分流組索引 (Bucket Index)
 */
export interface IGpsBucketIndex
{
	bucketX: number;
	bucketY: number;
}

/**
 * 分組結果的結構
 * Grouping result structure
 *
 * 格式：Record<BucketPath, Record<FileName, DataArray>>
 * Format: Record<BucketPath, Record<FileName, DataArray>>
 */
export type ISplitResult<T> = Record<IFormatBlockKey<'/'>, ISplitResultEntry<T>>;

/**
 * 分組結果的內層結構
 * Inner structure of grouping result
 *
 * 格式：Record<FileName, DataArray>
 * Format: Record<FileName, DataArray>
 */
export type ISplitResultEntry<T> = Record<IFormatBlockKey<'_'>, T[]>;

/**
 * 可迭代的資料陣列或生成器
 * Iterable data array or generator
 *
 * 支援陣列或 Iterable 類型
 * Supports array or Iterable type
 */
export type IValueArrayOrIterable<T> = T[] | Iterable<T>;

/**
 * 注意: y lat 在前, x lng 在後
 *
 * 除非有必要否則請勿使用此格式(例如第三方API要求使用此格式)
 * 除此以外 一律使用 {@link IGpsCoordinate}
 */
export type ICoordinateArrayLatLng = [
	/** y lat */
	lat: number,
	/** x lng */
	lng: number,
];

export type IMatchedBuckets = Record<IFormatBlockKey<'/'>, IFormatBlockKey<'_'>[]>;
