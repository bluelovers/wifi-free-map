/**
 * 批次區塊資料 API
 * Batch blocks data API
 *
 * 根據經緯度座標讀取該區塊與區塊組內的所有資料類型（WiFi、充電站）
 */
import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { getProvideMapLoadingStrategyByAnyCoord } from '@/lib/utils/grid/grid-utils-global';
import { __DATA_ROOT } from '@/lib/__root';
import {
	EnumDatasetType,
	IGeoCoord,
	IGpsLngLatMinMax,
	IMatchedBuckets,
} from '@/lib/utils/grid/grid-types';
import type { IMetadataBucketIndex } from '@/lib/utils/grid/grid-index-builder-v2';
import { IWiFiHotspot, IChargingStationMarker, IApiReturnBlocksBatch } from '@/types';
import { createHash } from 'crypto';
import { CACHE_MAX_AGE, CACHE_MAX_AGE_404 } from '@/lib/utils/fetch/fetcher';
import { _createProximityComparator } from '@/lib/utils/geo/geo-sort.';
import { calculateDistance } from '@/lib/utils/geo/geo-math';



/**
 * 生成 ETag / Generate ETag
 */
function generateETag(data: unknown): string
{
	const content = JSON.stringify(data);
	return `"${createHash('md5').update(content).digest('hex').slice(0, 16)}"`;
}

/**
 * 檢查 ETag 是否匹配 / Check if ETag matches
 */
function checkIfNoneMatch(request: Request, etag: string): boolean
{
	const ifNoneMatch = request.headers.get('if-none-match');
	return ifNoneMatch === etag;
}

/**
 * IApiReturnError
 */
interface IApiReturnError
{
	success: false;
	error: string;
}

/**
 * GET /api/blocks-batch?lat=xxx&lng=xxx
 * 根據座標取得該區塊與區塊組內的所有資料
 */
export async function GET(request: Request)
{
	const { searchParams } = new URL(request.url);
	const latStr = searchParams.get('lat');
	const lngStr = searchParams.get('lng');

	if (!latStr || !lngStr)
	{
		return NextResponse.json(
			{ success: false, error: 'Missing lat or lng parameter' },
			{ status: 400 },
		);
	}

	const lat = parseFloat(latStr);
	const lng = parseFloat(lngStr);

	if (isNaN(lat) || isNaN(lng))
	{
		return NextResponse.json(
			{ success: false, error: 'Invalid coordinate' },
			{ status: 400 },
		);
	}

	/** 初始化資料容器 */
	const data: IApiReturnBlocksBatch['data'] = {
		[EnumDatasetType.WIFI]: [],
		[EnumDatasetType.CHARGING]: [],
	}

	try
	{
		/** 計算區塊與區塊組資訊 */
		const resultData = getProvideMapLoadingStrategyByAnyCoord({ lng, lat } as IGeoCoord);

		/** 遍歷每個 bucket */
		for (const [bucketPath, blockIds] of Object.entries(resultData.matchedBuckets))
		{
			/** 讀取 bucket index */
			const indexPath = join(__DATA_ROOT, 'index', bucketPath, 'index.json');
			let bucketIndex: IMetadataBucketIndex | null = null;

			try
			{
				bucketIndex = await readFile(indexPath, 'utf-8').then(JSON.parse);
			}
			catch
			{
				/** index 不存在，跳過 */
				continue;
			}

			if (!bucketIndex?.data) continue;

			/** 遍歷每個 blockId */
			for (const blockId of blockIds)
			{
				const blockData = bucketIndex.data[blockId];
				if (!blockData) continue;

				const dataset = blockData.dataset;

				/** 讀取 WiFi 資料 */
				if (dataset[EnumDatasetType.WIFI])
				{
					const wifiPath = join(
						__DATA_ROOT,
						`${dataset[EnumDatasetType.WIFI].fileName}`,
					);

					const wifiArray = await readFile(wifiPath, 'utf-8').then(JSON.parse);
					data[EnumDatasetType.WIFI].push(...wifiArray);
				}

				/** 讀取充電站資料 */
				if (dataset[EnumDatasetType.CHARGING])
				{
					const chargingPath = join(
						__DATA_ROOT,
						`${dataset[EnumDatasetType.CHARGING].fileName}`,
					);

					const chargingArray = await readFile(chargingPath, 'utf-8').then(JSON.parse);
					data[EnumDatasetType.CHARGING].push(...chargingArray);
				}
			}
		}

		console.dir(resultData);

		/** 檢查是否有資料 */
		if (data[EnumDatasetType.WIFI].length === 0 && data[EnumDatasetType.CHARGING].length === 0)
		{
			const responseData = {
				...resultData,
				success: false,
				error: 'No data found',
				data,
			} as IApiReturnError;

			/** 生成 ETag 用於快取驗證 / Generate ETag for cache validation */
			const etag = generateETag(responseData);

			const headers = {
				'Cache-Control': `public, max-age=${CACHE_MAX_AGE_404}, must-revalidate`,
				ETag: etag,
			} satisfies ResponseInit["headers"];

			return NextResponse.json(responseData, {
				status: 404,
				headers,
			});
		}

		const comparator = _createProximityComparator(resultData.center, calculateDistance);

		data[EnumDatasetType.WIFI] = data[EnumDatasetType.WIFI].sort(comparator);
		data[EnumDatasetType.CHARGING] = data[EnumDatasetType.CHARGING].sort(comparator);

		const responseData: IApiReturnBlocksBatch = {
			...resultData,
			success: true,
			data,
		};

		/** 生成 ETag 用於快取驗證 / Generate ETag for cache validation */
		const etag = generateETag(responseData);

		const headers = {
			'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, must-revalidate`,
			ETag: etag,
		} satisfies ResponseInit["headers"];

		/** 檢查客戶端快取是否仍然有效 / Check if client cache is still valid */
		if (checkIfNoneMatch(request, etag))
		{
			return new NextResponse(null, {
				status: 304,
				headers,
			});
		}

		return NextResponse.json(responseData, {
			headers,
		});
	}
	catch (error)
	{
		console.error('Error fetching batch blocks data:', error);
		return NextResponse.json(
			{
				success: false,
				// error: 'Failed to fetch data',
				error,
				data,
			} as IApiReturnError,
			{ status: 500 },
		);
	}
}
