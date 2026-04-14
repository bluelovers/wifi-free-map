/**
 * 測試案例結構
 * Test case structure
 */
export interface ITestCase
{
	/** 測試名稱 / Test name */
	name: string;
	/** 輸入參數 / Input parameters */
	input: {
		lat: number;
		lng: number;
	};
	/** 預期區塊數量 / Expected block count */
	expectedBlockCount: number;
	/** 預期區塊 key / Expected block keys */
	expectedKeys: string[];
	/** 說明 / Note */
	note?: string;
}

/**
 * 測試群組結構
 * Test group structure
 */
export interface ITestGroup
{
	/** 測試群組名稱 / Test group name */
	name: string;
	/** 測試案例陣列 / Test cases array */
	testCases: ITestCase[];
}

/**
 * queryBlocksFromCenter 測試資料集
 * queryBlocksFromCenter test dataset
 *
 * 測試案例涵蓋：
 * - 區塊中心點（預期 1 區塊）
 * - 靠近邊界（預期 2 區塊）
 * - 靠近交匯點（預期 4 區塊）
 * - 真實座標驗證
 */
export const testGroups: ITestGroup[] = [
	{
		name: "區塊中心點測試 (應為 1 區塊)",
		testCases: [
			{
				name: "區塊中心點 1",
				input: { lat: 25.0495, lng: 121.4948 },
				expectedBlockCount: 1,
				expectedKeys: ["106_102"],
				note: "落在單一區塊內",
			},
			{
				name: "區塊中心點 2",
				input: { lat: 25.0495, lng: 121.5255 },
				expectedBlockCount: 1,
				expectedKeys: ["107_102"],
				note: "落在單一區塊內",
			},
			{
				name: "區塊中心點 3",
				input: { lat: 25.0802, lng: 121.4948 },
				expectedBlockCount: 1,
				expectedKeys: ["106_103"],
				note: "落在單一區塊內",
			},
			{
				name: "區塊中心點 4",
				input: { lat: 25.0802, lng: 121.5255 },
				expectedBlockCount: 1,
				expectedKeys: ["107_103"],
				note: "落在單一區塊內",
			},
		],
	},
	{
		name: "靠近邊界測試 (應為 2 區塊)",
		testCases: [
			{
				name: "靠近上方邊界",
				input: { lat: 25.038 + 0.015, lng: 121.51 },
				expectedBlockCount: 2,
				expectedKeys: ["106_101", "106_102"],
				note: "跨越水平邊界",
			},
			{
				name: "靠近下方邊界",
				input: { lat: 25.038 + 0.045, lng: 121.51 },
				expectedBlockCount: 2,
				expectedKeys: ["106_102", "106_103"],
				note: "跨越水平邊界",
			},
			{
				name: "靠近左方邊界",
				input: { lat: 25.046, lng: 121.51 - 0.007 },
				expectedBlockCount: 2,
				expectedKeys: ["105_102", "106_102"],
				note: "跨越垂直邊界",
			},
			{
				name: "靠近右方邊界",
				input: { lat: 25.046, lng: 121.51 + 0.015 },
				expectedBlockCount: 2,
				expectedKeys: ["106_102", "107_102"],
				note: "跨越垂直邊界",
			},
		],
	},
	{
		name: "靠近交匯點測試 (應為 4 區塊)",
		testCases: [
			{
				name: "靠近左上交匯點",
				input: { lat: 25.038 + 0.015, lng: 121.51 - 0.007 },
				expectedBlockCount: 4,
				expectedKeys: ["105_101", "106_101", "105_102", "106_102"],
				note: "跨越左上交匯點",
			},
			{
				name: "靠近右上交匯點",
				input: { lat: 25.038 + 0.015, lng: 121.51 + 0.015 },
				expectedBlockCount: 4,
				expectedKeys: ["106_101", "107_101", "106_102", "107_102"],
				note: "跨越右上交匯點",
			},
			{
				name: "靠近左下交匯點",
				input: { lat: 25.038 + 0.045, lng: 121.51 - 0.007 },
				expectedBlockCount: 4,
				expectedKeys: ["105_102", "106_102", "105_103", "106_103"],
				note: "跨越左下交匯點",
			},
			{
				name: "靠近右下交匯點",
				input: { lat: 25.038 + 0.045, lng: 121.51 + 0.015 },
				expectedBlockCount: 4,
				expectedKeys: ["106_102", "107_102", "106_103", "107_103"],
				note: "跨越右下交匯點",
			},
		],
	},
	{
		name: "真實座標驗證",
		testCases: [
			{
				name: "台北車站附近",
				input: { lat: 25.0478, lng: 121.5179 },
				expectedBlockCount: 4,
				expectedKeys: ["106_101", "107_101", "106_102", "107_102"],
				note: "台北車站周圍",
			},
			{
				name: "信義區",
				input: { lat: 25.0376, lng: 121.5651 },
				expectedBlockCount: 4,
				expectedKeys: ["108_101", "109_101", "108_102", "109_102"],
				note: "信義區周圍",
			},
			{
				name: "板橋區",
				input: { lat: 25.0131, lng: 121.4626 },
				expectedBlockCount: 4,
				expectedKeys: ["104_99", "105_99", "104_100", "105_100"],
				note: "板橋區周圍",
			},
		],
	},
];

/**
 * calculateIntersectingBlocks 測試資料集
 * calculateIntersectingBlocks test dataset
 */
export const calculateIntersectingBlocksTestGroups: ITestGroup[] = [
	{
		name: "小範圍測試",
		testCases: [
			{
				name: "範圍內只有一個區塊",
				input: { minLat: 25.04, maxLat: 25.045, minLng: 121.50, maxLng: 121.52 },
				expectedBlockCount: 2,
				expectedKeys: ["106_102", "107_102"],
				note: "跨越 col 邊界",
			},
			{
				name: "範圍內跨越兩個區塊",
				input: { minLat: 25.04, maxLat: 25.06, minLng: 121.50, maxLng: 121.55 },
				expectedBlockCount: 3,
				expectedKeys: ["106_102", "107_102", "108_102"],
				note: "任意範圍可能有 > 4 區塊",
			},
		],
	},
];

/**
 * getBlockRange 測試資料集
 * getBlockRange test dataset
 */
export const getBlockRangeTestGroups: ITestGroup[] = [
	{
		name: "基本測試",
		testCases: [
			{
				name: "標準範圍",
				input: { minLat: 25.04, maxLat: 25.06, minLng: 121.50, maxLng: 121.55 },
				expectedBlockCount: 3,
				expectedKeys: [],
				note: "startRow=102, endRow=102, startCol=106, endCol=108",
			},
		],
	},
];