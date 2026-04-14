export interface IGpsRowColStartEnd
{
	startRow: number;
	endRow: number;
	startCol: number;
	endCol: number;
}

export interface IGpsLatLngMaxMin
{
	minLat: number;
	maxLat: number;
	minLng: number;
	maxLng: number;
}

/** 區塊索引 / Block index */
export interface IGpsRowCol
{
	row: number;
	col: number;
}

export interface IGpsCoordinate
{
	lat: number;
	lng: number;
}

/**
 * 統一格式的區塊邊界介面
 * Unified grid bounds interface
 */
export interface IBounds
{
	/** 西北角座標 / Northwest corner coordinates */
	northWest: IGpsCoordinate;
	/** 東北角座標 / Northeast corner coordinates */
	northEast: IGpsCoordinate;
	/** 西南角座標 / Southwest corner coordinates */
	southWest: IGpsCoordinate;
	/** 東南角座標 / Southeast corner coordinates */
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

export interface IDataset extends Record<string, IDatasetEntry>
{

}

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
export interface IBlockCoordinate extends IGpsCenterBounds, IGpsRowCol
{
	/** 用於查詢 grid-index.json 的 key (lng_lat) / Key for querying grid-index.json */
	lngLat: string;
}

export interface IDataEntry extends IGpsCoordinate
{
	address?: string;
}
