/**
 * 網格計算常數定義
 * Grid computation constants for geographic data processing.
 *
 * @fileoverview 地理空間網格系統配置 (Spatial Grid System Configuration)
 *
 * [核心架構合約 / Core Architecture Contract]
 *
 * 1. 原點不變性：GLOBAL_GRID_CONFIG_ORIGIN 為計算基準，產生實體資料後嚴禁修改。
 * 2. 邊界規則：採用「左閉右開」原則 [Closed, Open)，剛好在邊界的座標歸入高索引網格。
 * 3. 分層結構：L0 (0.02°, 檔案) < L1 (0.30°, 資料夾) < L2 (4.50°, 區域)。
 *
 * 修改本檔案前請務必確認對現有 JSON 路徑的影響。
 *
 * [邊界規則 / Boundary Rules]
 *
 * 本系統採用「左閉右開」原則 [Closed, Open)。
 * 一個網格包含其左邊界與下邊界，但不包含右邊界與上邊界。
 * 例如：座標剛好為 121.02 時，會被分配到以 121.02 為起點的下一個網格。
 * * Rules: [Closed, Open).
 * Coordinates exactly at the boundary belong to the higher index block.
 */
import { IGpsLngLatMinMax, IGpsCoordinate } from "./grid-types";

/**
 * 區塊大小（萬華區的座標範圍）原始值為 0.0306959
 * Block size (Wanhua district coordinate range) original value is 0.0306959
 *
 * 為了方便計算，這裡調整為 0.02
 * 大約是從萬華車站走到西門町的距離。
 * 這對使用者最友善，因為「附近的充電站」通常就在這個範圍內。
 * For convenient calculation, adjusted to 0.02 here.
 * Approximately the distance from Wanhua Station to Ximen Area.
 * Most user-friendly as "nearby charging stations" usually fall within this range.
 */
export const BLOCK_SIZE = 0.02 as const;

/**
 * 台灣地理邊界
 * Taiwan geographic boundaries
 */
export const TAIWAN_BOUNDS = {
	/** 稍微南移，對齊 0.1 原始值為 21.903126 / Slightly south, align to 0.1 original value 21.903126 */
	minLat: 21.90,
	/** 稍微北移，對齊 0.1 原始值為 26.3758 / Slightly north, align to 0.1 original value 26.3758 */
	maxLat: 26.40,
	/** 向西擴展到 118 整數，對齊金馬與澎湖海域 原始值為 118.2257211 / Expand west to 118, align to Kinmen/Matsu/Penghu waters original value 118.2257211 */
	minLng: 118.00,
	/** 向東擴展到 122 整數 / Expand east to 122 */
	maxLng: 122.00,
} as const satisfies IGpsLngLatMinMax;

/**
 * 全球網格配置：原點
 * Global grid configuration: origin
 *
 * 全球通用網格配置，建議使用 (0,0) 或 (-180, -90) 作為全球唯一原點，這樣最直覺
 * 如果想沿用你原本的台灣設定也完全沒問題
 *
 * Global universal grid configuration, recommend using (0,0) or (-180, -90) as global origin for intuitiveness
 * Using original Taiwan settings is also fine
 *
 * [維護警告 / Maintenance Warning]
 * 原點 (ORIGIN) 是所有網格索引的計算基準。
 * 一旦產生實體資料後，請勿隨意修改 TAIWAN_BOUNDS.minLng/minLat。
 * 修改原點將導致所有已儲存的檔案路徑 (L1) 與檔名 (L0) 偏移，必須重新遷移全量資料。
 * * The ORIGIN is the basis for all grid index calculations.
 * DO NOT change TAIWAN_BOUNDS.minLng/minLat after data is generated.
 * Changing it will shift all stored paths and filenames.
 */
export const GLOBAL_GRID_CONFIG_ORIGIN = {
	lng: TAIWAN_BOUNDS.minLng,
	lat: TAIWAN_BOUNDS.minLat,
} as const satisfies IGpsCoordinate;

/** 浮點數 epsilon 值用於修正計算誤差 / Float epsilon value for correcting calculation errors */
export const GLOBAL_GRID_CONFIG_EPSILON = 1e-9 as const;

/** 座標精度（小數位數）/ Coordinate precision (decimal places) */
export const GLOBAL_GRID_CONFIG_PRECISION = 4 as const;

/**
 * 座標轉換因子 / Coordinate conversion factor
 *
 * [精度說明 / Precision Note]
 * - PRECISION (4): 用於檔案命名與目錄索引，確保路徑簡潔且具備約 11m 精度。
 * - FACTOR (1000000): 用於記憶體內排序與去重，提供約 0.11m 的絕對計算精度。
 */
export const GLOBAL_GRID_CONFIG_FACTOR = 1000000 as const;

/**
 * 擴充配置：分流設定
 * Extended configuration: shunting/diversion settings
 *
 * 15x15 個區塊為一組 / 15x15 blocks as a group (0.3° x 0.3°)
 *
 * 分組大小：決定 L1 資料夾的範圍。
 * 15x15 確保一個 Bucket (0.3°) 能完整覆蓋如「雙北核心區」的大型都會區，
 * 避免頻繁跨資料夾請求。
 *
 * 根據地理資訊，台北市的極值大約如下：
 * According to geographic information, Taipei City extremes approximately:
 * - 緯度 (Lat)：24.961° ~ 25.210°（跨度約 0.249°）
 * - 經度 (Lng)：121.457° ~ 121.666°（跨度約 0.209°）
 *
 * 台北市的座標範圍大約 11x13 個區塊
 * Taipei City coordinate range approximately 11x13 blocks
 *
 * 層級規模換算表 / Level scale conversion table:
 * | 層級 (Level) | 跨度 (度) | 物理尺寸 (約略) | 覆蓋能力範例 |
 * | L0 (底層)    | 0.02°     | 2.1 km          | 西門町、萬華車站周邊 |
 * | L1 (資料夾層) | 0.30°    | 32 km           | 台北市 + 新北市核心區 |
 * | L2 (區域層)  | 4.50°    | 480 km          | 全台灣 (南北約 3.5°) |
 * | L3 (跨國層)  | 67.5°    | 7,200 km        | 整個中國 + 大部分東南亞 |
 *
 * 基於此，我們可以設定 15x15 個區塊為一組
 * Based on this, we set 15x15 blocks as a group
 *
 * [分流路徑對照示例 / Path Mapping Examples]
 *
 * 以台北萬華 (121.48, 25.02) 為基準的計算流程：
 * 1. 經度偏移 = 121.48 - 118.00 = 3.48
 * 2. Lng_Bucket_Start = Math.floor(3.48 / 0.3) * 0.3 + 118.00 = 121.3000
 * 3. Lng_Block_Start  = Math.floor(3.48 / 0.02) * 0.02 + 118.00 = 121.4800
 *
 * 最終歸位路徑: /121.3000/24.9000/121.4800_25.0200.json
 */
export const BUCKET_CONFIG_GROUP_SIZE = 15 as const;

/**
 * 資料類型設定
 * Data type configuration
 *
 * 用於區分不同類型的地理資料（如 WiFi 熱點、充電站等）
 * Used to differentiate different types of geographic data (e.g., WiFi hotspots, charging stations)
 */
export const DATA_TYPES = [
	{ type: "wifi", dir: "grid-wifi", prefix: "grid-wifi/" },
	{ type: "charging", dir: "grid-charging", prefix: "grid-charging/" },
] as const;
