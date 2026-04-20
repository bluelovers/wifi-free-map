/**
 * 區塊化 WiFi 熱點資料 API
 * Block-based WiFi hotspots data API
 *
 * 根據經緯度座標讀取該區塊與區塊組內的wifi資料
 */
import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import {
	calcGlobalBlockIndexAndCoord,
	_formatBlockKey,
	calcCoordToBucketIndexAndCoord,
} from '@/lib/utils/grid/grid-utils-global';
import { __DATA_ROOT, __ROOT } from '@/lib/__root';
import { IHotspot } from '@/types/station-wifi';
import { IFormatBlockKey } from '@/lib/utils/grid/grid-types';

/**
 * GET /api/hotspots-block?lat=xxx&lng=xxx
 * 根據座標取得該區塊內的 WiFi 資料
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
		const blockData = calcGlobalBlockIndexAndCoord({ lng, lat });
		const bucketData = calcCoordToBucketIndexAndCoord({ lng, lat });

		/** 建立區塊組索引路徑 */
		const bucketKey = _formatBlockKey(bucketData.bucketCoord.lng, bucketData.bucketCoord.lat, { sep: '/' });

		const indexPath = join(__DATA_ROOT, 'index', bucketKey, 'index.json');

		/** 讀取區塊組索引 */
		let activeBlocks: string[] = [];
		let indexData: {
			activeBlocks: IFormatBlockKey[]
		};

		try
		{
			indexData = await readFile(indexPath, 'utf-8').then(JSON.parse);
			activeBlocks = indexData.activeBlocks;
		}
		catch
		{
			// index not found, continue with empty
		}

		/** 建立區塊資料路徑並讀取 */
		const blockKey = _formatBlockKey(blockData.minLng, blockData.minLat);

		const blockPath = join(__DATA_ROOT, 'grid-wifi', bucketKey, `${blockKey}.json`);

		let wifiData: unknown[] = [];

		try
		{
			const blockJson: IHotspot[] = await readFile(blockPath, 'utf-8').then(JSON.parse);

			// Transform to IWiFiHotspot format
			wifiData = blockJson.map((item) =>
			{
				const record = item as IHotspot & { password?: string };
				const lat = record.lat || 0;
				const lng = record.lng || 0;

				return {
					id: `${lng}_${lat}_${Math.random().toString(36).slice(2, 8)}`,
					source: 'user_contributed' as const,
					name: record.name || '',
					ssid: '',
					password: record.password || '',
					location: {
						lat,
						lng,
						address: record.address || '',
					},
					provider: '',
					isFree: true,
					isOpen: true,
				};
			}) as unknown[];
		}
		catch
		{
			// block not found, continue with empty
		}

		return NextResponse.json({
			success: true,
			data: wifiData,
			bucket: {
				lng: bucketData.bucketCoord.lng,
				lat: bucketData.bucketCoord.lat,
				indexPath: `/data/index/${bucketKey}/index.json`,
				activeBlocks: activeBlocks.length,
			},
			block: {
				lng: blockData.minLng,
				lat: blockData.minLat,
				dataPath: `/data/grid-wifi/${bucketKey}/${blockKey}.json`,
				dataCount: wifiData.length,
			},
		});
	}
	catch (error)
	{
		console.error('Error fetching block data:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch data' },
			{ status: 500 },
		);
	}
}
