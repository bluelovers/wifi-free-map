import { ITSPickExtra } from 'ts-type';

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
 * 資料來源列舉
 * Dataset source enumeration
 *
 * 用於識別資料的來源
 * Used to identify the source of data
 */
export enum EnumDatasetSource
{
	/** 政府資料開放平臺 / Government open data platform */
	GOV_DATA = "gov-data",
	/** 使用者貢獻 / User contributed */
	USER_CONTRIBUTED = "user_contributed",
}

/**
 * Wi-Fi 認證類型列舉
 * Wi-Fi authentication type enumeration
 *
 * 用於識別 WiFi 熱點的認證方式
 * Used to identify the authentication method of WiFi hotspots
 */
export enum EnumWifiAuthType
{
	/** 無需認證 / No authentication */
	NONE = "none",
	/** Wi‑Fi 密碼認證 / Wi‑Fi password authentication */
	PASSWORD = "password",

	/** Wi‑Fi Portal 認證 / Wi‑Fi portal authentication */
	PORTAL = "portal",

	/** Wi‑Fi Portal 短信認證 / Wi‑Fi portal SMS authentication */
	PORTAL_SMS = "portal_sms",

	/** Wi‑Fi Portal 廣告認證 / Wi‑Fi portal advertisement authentication */
	PORTAL_AD = "portal_ad",

	/** Wi‑Fi Portal 使用者認證 / Wi‑Fi portal user authentication */
	PORTAL_USER = "portal_user",
}

/**
 * Wi-Fi SSID 名稱列舉
 * Wi-Fi SSID name enumeration
 */
export enum EnumWifiSSIDName
{
	/** 台北市免費 Wi-Fi / Taipei City Free Wi-Fi */
	TAIPEI_FREE_WIFI = "TPE-Free",

	/** iTaiwan 公眾 Wi-Fi / iTaiwan public Wi-Fi */
	ITAIWAN = "iTaiwan",
}

/**
 * 範圍修正寬高比模式列舉
 * Range rectify aspect ratio mode enumeration
 *
 * 用於指定範圍修正時要調整經度或緯度
 * Specifies whether to adjust longitude or latitude when rectifying range
 */
export enum EnumRectifyRangeAspectRatioMode
{
	/** 調整經度 / Adjust longitude */
	ADJUST_LNG = 1,
	/** 調整緯度（不推薦）/ Adjust latitude (not recommended) */
	ADJUST_LAT = 2,
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
export interface IGeoBlockIndex
{
	/** X lng 方向索引（經度）/ X direction index (longitude) */
	xLngIdx: number;
	/** Y lat 方向索引（緯度）/ Y direction index (latitude) */
	yLatIdx: number;
}

/**
 * GPS 座標介面
 * GPS coordinate interface
 *
 * 描述地理座標點
 * Describes geographic coordinate point
 */
export interface IGeoCoord
{
	/** X 座標（經度）/ X coordinate (longitude) */
	lng: number;
	/** Y 座標（緯度）/ Y coordinate (latitude) */
	lat: number;
}

/**
 * navigator.geolocation.getCurrentPosition 返回的座標
 * Coordinates returned by navigator.geolocation.getCurrentPosition
 */
export type IGeolocationApiCoord = ITSPickExtra<GeolocationCoordinates, 'longitude' | 'latitude'>;

/**
 * 統一格式的區塊邊界介面
 * Unified grid bounds interface
 *
 * 描述區塊的四角座標
 * Describes the four corner coordinates of a block
 */
export interface IGeoBounds
{
	/** (0,1) 西北角座標 / Northwest corner coordinates */
	northWest: IGeoCoord;
	/** (1,1) 東北角座標 / Northeast corner coordinates */
	northEast: IGeoCoord;
	/** (0,0) 西南角座標 / Southwest corner coordinates */
	southWest: IGeoCoord;
	/** (1,0) 東南角座標 / Southeast corner coordinates */
	southEast: IGeoCoord;
}

/**
 * 網格 Block Index 檔案名稱型別
 * Grid block index file name type
 *
 * @typeParam T - 資料類型 / Dataset type
 *
 * @example
 * grid-wifi/121.9000/24.9000/121.9200_24.9600.json
 */
export type IGridBlockIndexFileName<T extends EnumDatasetType> = `grid-${T}/${IFormatBlockKey<'/'>}/${IFormatBlockKey<'_'>}.json`;

/**
 * 資料集項目介面
 * Dataset entry interface
 *
 * 描述單一區塊內的資料集項目
 * Describes dataset entry within a single block
 */
export interface IDatasetEntry<T extends EnumDatasetType = EnumDatasetType>
{
	/**
	 * 資料類型檔案路徑 / Data type file path
	 *
	 * @example
	 * // 使用以下範例即可取得完整路徑
	 * join(__DATA_ROOT, fileName)
	 */
	fileName: IGridBlockIndexFileName<T>;
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
export interface IGeoBlockGridIndexRange
{
	/** X lng 方向（經度）索引最小值 / X direction (longitude) index minimum */
	xLngIdxStart: number;
	/** X lng 方向（經度）索引最大值 / X direction (longitude) index maximum */
	xLngIdxEnd: number;
	/** Y lat 方向（緯度）索引最小值 / Y direction (latitude) index minimum */
	yLatIdxStart: number;
	/** Y lat 方向（緯度）索引最大值 / Y direction (latitude) index maximum */
	yLatIdxEnd: number;
}

/**
 * 分流組索引介面
 * Bucket grid index interface
 *
 * 用於識別分流組（Bucket）在網格中的位置
 * Used to identify the position of a bucket in the grid
 */
export interface IGeoBucketGridIndex
{
	/** X 方向（經度）組索引 / X direction (longitude) bucket index */
	bucketX: number;
	/** Y 方向（緯度）組索引 / Y direction (latitude) bucket index */
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
 * 注意：Array 通常是 Leaflet/Google Maps 慣用的 [lat, lng], y lat 在前, x lng 在後
 *
 * 此格式的預設精度為 GLOBAL_GRID_CONFIG_PRECISION_MAKRER
 *
 * 除非有必要否則請勿使用此格式(例如第三方API要求使用此格式)
 * 除此以外 一律使用 {@link IGeoCoord}
 */
export type IGeoPointTupleLatLng = [
	/** y lat */
	lat: number,
	/** x lng */
	lng: number,
];

/**
 * 匹配的 Bucket 對應表型別
 * Matched buckets mapping type
 *
 * 以 Bucket 路徑為鍵，對應多個區塊鍵值陣列
 * Maps bucket paths to arrays of block keys
 */
export type IMatchedBuckets = Record<IFormatBlockKey<'/'>, IFormatBlockKey<'_'>[]>;

/**
 * 二維座標介面
 * Two-dimensional coordinate interface
 *
 * 通用 XY 座標，用於非地理空間的索引或網格計算
 * Generic XY coordinate for non-geospatial indexing or grid calculations
 */
export interface IXYCoord
{
	/** X 座標 / X coordinate */
	x: number;
	/** Y 座標 / Y coordinate */
	y: number;
}

/**
 * 地理座標鄰近度函數型別
 * Geographic coordinate proximity function type
 *
 * 用於計算排序或距離的函數介面定義
 * Function interface for sorting or distance calculation
 *
 * @param coordFrom - 起始座標 / Starting coordinate
 * @param coordTo - 目標座標 / Target coordinate
 * @returns 距離或鄰近度數值 / Distance or proximity value
 */
export type IFnGeoCoordProximity = (coordFrom: IGeoCoord, coordTo: IGeoCoord) => number;
