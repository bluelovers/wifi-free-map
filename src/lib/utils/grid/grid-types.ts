export enum EnumDatasetType
{
	WIFI = "wifi",
	CHARGING = "charging",
}

export interface IGpsRowColStartEnd
{
	startX: number;
	endX: number;
	startY: number;
	endY: number;
}

export interface IGpsLngLatMin
{
	/** x lng 經度最小值 / Minimum longitude */
	minLng: number;
	/** y lat 緯度最小值 / Minimum latitude */
	minLat: number;
}

export interface IGpsLngLatMax
{
	/** x lng 經度最大值 / Maximum longitude */
	maxLng: number;
	/** y lat 緯度最大值 / Maximum latitude */
	maxLat: number;
}

export interface IGpsLngLatMinMax extends IGpsLngLatMin, IGpsLngLatMax
{

}

/** 區塊索引 / Block index */
export interface IGpsBlockIndex
{
	/**
	 * x lng 索引
	 */
	xIdx: number;
	/**
	 * y lat 索引
	 */
	yIdx: number;
}

export interface IGpsCoordinate
{
	/**
	 * x
	 */
	lng: number;
	/**
	 * y
	 */
	lat: number;
}

/**
 * 統一格式的區塊邊界介面
 * Unified grid bounds interface
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
 */
export interface IDatasetEntry
{
	/** 資料類型檔案路徑 / Data type file path */
	fileName: string;
	/** 該區塊內的資料筆數 / Number of items in this block */
	count: number;
}

export type IDataset = Record<EnumDatasetType, IDatasetEntry>;

/**
 * 統一格式的區塊介面
 * Unified grid block interface
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
 */
export interface IBlockData extends IGpsCenterBounds
{
	locations: Set<string>;
	dataset: IDataset;
}

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
 */
export interface IBlockCoordinate extends IGpsCenterBounds, IGpsBlockIndex
{
	/** 用於查詢 grid-index.json 的 key (lng_lat) / Key for querying grid-index.json */
	lngLat: string;
}

export interface IDataEntry extends IGpsCoordinate
{
	address?: string;
}

/**
 * 地址解析工具
 * Address parsing utilities for geographic data processing.
 *
 * 提供共用的地址解析函式，可用於運行時（客戶端）與構建時（腳本）。
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
