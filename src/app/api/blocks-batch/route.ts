/**
 * 批次區塊資料 API
 * Batch blocks data API
 *
 * 根據經緯度座標讀取該區塊與區塊組內的所有資料類型（WiFi、充電站）
 */
import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { getRangeAndBlockIdsFromAnyCoordForMap } from '@/lib/utils/grid/grid-utils-global';
import { __DATA_ROOT } from '@/lib/__root';
import {
	EnumDatasetType,
	IGeoCoord,
	IGpsLngLatMinMax,
	IMatchedBuckets,
} from '@/lib/utils/grid/grid-types';
import type { IMetadataBucketIndex } from '@/lib/utils/grid/grid-index-builder-v2';
import { IWiFiHotspot, IChargingStationMarker, IApiReturnBlocksBatch } from '@/types';

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

	try
	{
		/** 計算區塊與區塊組資訊 */
		const {
			matchedBuckets,
			matchedRange,
			triggerRange,
			...rest
		} = getRangeAndBlockIdsFromAnyCoordForMap({ lng, lat } as IGeoCoord);

		/** 初始化資料容器 */
		const wifiData: IWiFiHotspot[] = [];
		const chargingData: IChargingStationMarker[] = [];

		/** 遍歷每個 bucket */
		for (const [bucketPath, blockIds] of Object.entries(matchedBuckets))
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
					wifiData.push(...wifiArray);
				}

				/** 讀取充電站資料 */
				if (dataset[EnumDatasetType.CHARGING])
				{
					const chargingPath = join(
						__DATA_ROOT,
						`${dataset[EnumDatasetType.CHARGING].fileName}`,
					);

					const chargingArray = await readFile(chargingPath, 'utf-8').then(JSON.parse);
					chargingData.push(...chargingArray);
				}
			}
		}

		console.dir({
			matchedBuckets,
			matchedRange,
			triggerRange,
			rest,
		});

		/** 檢查是否有資料 */
		if (wifiData.length === 0 && chargingData.length === 0)
		{
			return NextResponse.json({
				success: false,
				error: 'No data found',
				matchedBuckets,
				matchedRange,
				triggerRange,
			} as IApiReturnError, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			matchedBuckets,
			matchedRange,
			triggerRange,
			data: {
				[EnumDatasetType.WIFI]: wifiData,
				[EnumDatasetType.CHARGING]: chargingData,
			},
		} as IApiReturnBlocksBatch);
	}
	catch (error)
	{
		console.error('Error fetching batch blocks data:', error);
		return NextResponse.json(
			{
				success: false,
				// error: 'Failed to fetch data',
				error,
			} as IApiReturnError,
			{ status: 500 },
		);
	}
}
