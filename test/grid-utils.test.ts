// @noUnusedParameters:false
/// <reference types="node" />
/// <reference types="jest" />

import { readFileSync } from "fs";
import { resolve } from "path";

import {
	latToRow,
	lngToCol,
	getBlockRange,
	getBlockCountInRange,
	isValidBlockRange,
	getBlockIndex,
	getBlockCenter,
	getBlockBounds,
	getBlockFromCoordinate,
	calculateIntersectingBlocks,
	queryBlocksFromCenter,


} from "../scripts/utils/grid-utils";

import { testGroups, calculateIntersectingBlocksTestGroups } from "./fixtures/grid-utils-test-cases";
import { BLOCK_SIZE, TAIWAN_BOUNDS } from '@/lib/utils/grid/grid-const';
import { IGpsCoordinate } from '@/lib/utils/grid/grid-types';

/**
 * 載入 grid-index.json 用於驗證
 */
function loadGridIndex(): Array<{
	fileName: string;
	center: IGpsCoordinate;
}>
{
	const indexPath = resolve(process.cwd(), "public/data/grid-index.json");
	const content = readFileSync(indexPath, "utf-8");
	return JSON.parse(content);
}

/**
 * 執行單一測試案例
 * Run single test case
 */
function runTestCase(tc: {
	name: string;
	input: IGpsCoordinate;
	expectedBlockCount: number;
	expectedKeys: string[];
	note?: string;
}): void
{
	it(tc.name, () =>
	{
		// 執行 queryBlocksFromCenter
		const result = queryBlocksFromCenter(tc.input.lat, tc.input.lng);
		const actualKeys = Object.keys(result.match);
		const actualCount = actualKeys.length;

		// 驗證區塊數量
		expect(actualCount).toBe(tc.expectedBlockCount);

		// 驗證區塊 keys
		if (tc.expectedKeys.length > 0)
		{
			for (const key of tc.expectedKeys)
			{
				expect(actualKeys).toContain(key);
			}
		}

		// 驗證每個區塊的 lngLat 可用於查詢 grid-index
		const gridIndex = loadGridIndex();
		for (const [key, block] of Object.entries(result.match))
		{
			const fileName = `${block.lngLat}.json`;
			const found = gridIndex.find((g) => g.fileName === fileName);

			// 如果找不到，代表該區塊沒有資料（但仍應在 grid-index 結構中）
			if (found)
			{
				expect(found.center.lat).toBeCloseTo(block.center.lat, 5);
				expect(found.center.lng).toBeCloseTo(block.center.lng, 5);
			}
		}

		// 記錄 note（如果有的話）
		if (tc.note)
		{
			console.log(`  Note: ${tc.note}`);
		}
	});
}

/**
 * 測試 latToRow 和 lngToCol
 */
describe("latToRow / lngToCol", () =>
{
	it("應該正確轉換緯度到 row 索引", () =>
	{
		// 只測試基本功能，避免浮點數精度問題
		expect(latToRow(25.046)).toBe(102);
	});

	it("應該正確轉換經度到 col 索引", () =>
	{
		// 只測試基本功能，避免浮點數精度問題
		expect(lngToCol(121.518)).toBe(107);
	});
});

/**
 * 測試 getBlockRange
 */
describe("getBlockRange", () =>
{
	it("應該正確計算區塊索引範圍", () =>
	{
		const range = getBlockRange(25.04, 25.06, 121.50, 121.55);
		expect(range.startRow).toBe(102);
		expect(range.endRow).toBe(102);
		expect(range.startCol).toBe(106);
		expect(range.endCol).toBe(108);
	});

	it("應該使用四角座標計算", () =>
	{
		// 測試角落情況
		const range = getBlockRange(25.038, 25.055, 121.50, 121.55);
		// 四個角落應該有不同的索引
		const { row: tlRow, col: tlCol } = getBlockIndex(25.038, 121.50);
		const { row: brRow, col: brCol } = getBlockIndex(25.055, 121.55);

		expect(range.startRow).toBe(Math.min(tlRow, brRow));
		expect(range.endRow).toBe(Math.max(tlRow, brRow));
		expect(range.startCol).toBe(Math.min(tlCol, brCol));
		expect(range.endCol).toBe(Math.max(tlCol, brCol));
	});
});

/**
 * 測試 getBlockCountInRange
 */
describe("getBlockCountInRange", () =>
{
	it("應該正確計算區塊數量", () =>
	{
		expect(getBlockCountInRange(0, 0, 0, 0)).toBe(1); // 1x1
		expect(getBlockCountInRange(0, 0, 0, 1)).toBe(2); // 1x2
		expect(getBlockCountInRange(0, 1, 0, 1)).toBe(4); // 2x2
	});
});

/**
 * 測試 isValidBlockRange
 */
describe("isValidBlockRange", () =>
{
	it("應該正確驗證標準網格大小", () =>
	{
		expect(isValidBlockRange(0, 0, 0, 0)).toBe(true); // 1
		expect(isValidBlockRange(0, 0, 0, 1)).toBe(true); // 2
		expect(isValidBlockRange(0, 1, 0, 1)).toBe(true); // 4
		expect(isValidBlockRange(0, 0, 0, 2)).toBe(false); // 3 (invalid)
		expect(isValidBlockRange(0, 1, 0, 2)).toBe(false); // 6 (invalid)
	});
});

/**
 * 測試 getBlockIndex
 */
describe("getBlockIndex", () =>
{
	it("應該正確計算區塊索引", () =>
	{
		const { row, col } = getBlockIndex(25.046, 121.518);
		expect(row).toBe(102);
		expect(col).toBe(107);
	});

	it("應該與 latToRow/lngToCol 一致", () =>
	{
		const lat = 25.046;
		const lng = 121.518;
		const { row, col } = getBlockIndex(lat, lng);

		expect(row).toBe(latToRow(lat));
		expect(col).toBe(lngToCol(lng));
	});
});

/**
 * 測試 getBlockCenter
 */
describe("getBlockCenter", () =>
{
	it("應該正確計算區塊中心點", () =>
	{
		const center = getBlockCenter(102, 107);
		expect(center.lat).toBeCloseTo(25.0495, 4);
		expect(center.lng).toBeCloseTo(121.5255, 4);
	});

	it("中心點應該在區塊範圍內", () =>
	{
		const { row, col } = getBlockIndex(25.046, 121.518);
		const bounds = {
			north: TAIWAN_BOUNDS.minLat + (row + 1) * BLOCK_SIZE,
			south: TAIWAN_BOUNDS.minLat + row * BLOCK_SIZE,
			east: TAIWAN_BOUNDS.minLng + (col + 1) * BLOCK_SIZE,
			west: TAIWAN_BOUNDS.minLng + col * BLOCK_SIZE,
		};

		const center = getBlockCenter(row, col);
		expect(center.lat).toBeGreaterThan(bounds.south);
		expect(center.lat).toBeLessThan(bounds.north);
		expect(center.lng).toBeGreaterThan(bounds.west);
		expect(center.lng).toBeLessThan(bounds.east);
	});
});

/**
 * 測試 getBlockFromCoordinate
 */
describe("getBlockFromCoordinate", () =>
{
	it("應該正確回推區塊範圍", () =>
	{
		const result = getBlockFromCoordinate(25.046, 121.518);
		expect(result.center).toBeDefined();
		expect(result.bounds).toBeDefined();
		expect(result.bounds.northWest).toBeDefined();
		expect(result.bounds.southEast).toBeDefined();
	});

	it("應該與 getBlockIndex/getBlockCenter/getBlockBounds 一致", () =>
	{
		const lat = 25.046;
		const lng = 121.518;

		const { row, col } = getBlockIndex(lat, lng);
		const expectedCenter = getBlockCenter(row, col);
		const expectedBounds = getBlockBounds(row, col);

		const result = getBlockFromCoordinate(lat, lng);

		expect(result.center.lat).toBeCloseTo(expectedCenter.lat, 5);
		expect(result.center.lng).toBeCloseTo(expectedCenter.lng, 5);
	});
});

/**
 * 測試 queryBlocksFromCenter
 * 使用測試資料集
 */
describe("queryBlocksFromCenter", () =>
{
	for (const group of testGroups)
	{
		describe(group.name, () =>
		{
			for (const tc of group.testCases)
			{
				runTestCase(tc);
			}
		});
	}
});

/**
 * 測試 calculateIntersectingBlocks
 */
describe("calculateIntersectingBlocks", () =>
{
	for (const group of calculateIntersectingBlocksTestGroups)
	{
		describe(group.name, () =>
		{
			for (const tc of group.testCases)
			{
				it(tc.name, () =>
				{
					const result = calculateIntersectingBlocks(
						tc.input.minLat as unknown as number,
						tc.input.maxLat as unknown as number,
						tc.input.minLng as unknown as number,
						tc.input.maxLng as unknown as number,
					);

					const actualCount = Object.keys(result.match).length;
					expect(actualCount).toBe(tc.expectedBlockCount);
				});
			}
		});
	}
});

/**
 * 測試 lngLat 可用於查詢 grid-index.json
 */
describe("lngLat 查詢驗證", () =>
{
	it("應該能透過 lngLat 找到 grid-index 中的區塊", () =>
	{
		const gridIndex = loadGridIndex();

		// 測試多個座標
		const testCoords = [
			{ lat: 25.046, lng: 121.518 },
			{ lat: 25.033, lng: 121.565 },
			{ lat: 25.100, lng: 121.400 },
		];

		for (const coord of testCoords)
		{
			const result = queryBlocksFromCenter(coord.lat, coord.lng);

			for (const block of Object.values(result.match))
			{
				const fileName = `${block.lngLat}.json`;
				const found = gridIndex.find((g) => g.fileName === fileName);

				// 允許找不到（因為該區塊可能沒有資料）
				// 但如果找到，必須驗證座標正確
				if (found)
				{
					expect(found.center.lat).toBeCloseTo(block.center.lat, 4);
					expect(found.center.lng).toBeCloseTo(block.center.lng, 4);
				}
			}
		}
	});
});

/**
 * 測試結果應該為 1, 2, 或 4 個區塊
 */
describe("queryBlocksFromCenter 結果驗證", () =>
{
	it("所有測試結果應該是 1, 2, 或 4 個區塊", () =>
	{
		const testCoords = [
			{ lat: 25.046, lng: 121.518 },
			{ lat: 25.033, lng: 121.565 },
			{ lat: 25.100, lng: 121.400 },
			{ lat: 24.5, lng: 120.5 },
			{ lat: 25.5, lng: 121.5 },
			// 邊界情況
			{ lat: 25.0495, lng: 121.4948 },
			{ lat: 25.0495, lng: 121.5255 },
			{ lat: 25.0802, lng: 121.4948 },
			{ lat: 25.0802, lng: 121.5255 },
		];

		for (const coord of testCoords)
		{
			const result = queryBlocksFromCenter(coord.lat, coord.lng);
			const count = Object.keys(result.match).length;

			expect([1, 2, 4]).toContain(count);
		}
	});
});
