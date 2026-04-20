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
	_formatBlockKey,
	calcCoordToBucketIndexAndCoord,
	calcGlobalBlockIndexAndCoord,
} from '@/lib/utils/grid/grid-utils-global';
import { __DATA_ROOT } from '@/lib/__root';
import { IHotspot } from '@/types/station-wifi';
import { IApiReturnError, IApiReturnWifi, IWiFiHotspot } from '@/types';
import { IFormatBlockKey } from '@/lib/utils/grid/grid-types';

/**
 * GET /api/wifi-block?lat=xxx&lng=xxx
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

		/** WiFi 熱點資料（IWiFiHotspot 結構） */
		let wifiData: IWiFiHotspot[] = [];

		try
		{
			const blockJson: (IHotspot & { password?: string })[] = await readFile(blockPath, 'utf-8').then(JSON.parse);

			/** 將 IHotspot 轉換為 IWiFiHotspot */
			wifiData = blockJson.map((item, index) =>
			{
				return {
					...item,
					id: `${item.lng}_${item.lat}_${index}`,
					source: 'user_contributed' as const,
					ssid: '',
					password: item.password || '',
					provider: '',
					isFree: true,
					isOpen: true,
					createdAt: new Date(),
					createdBy: '',
					verified: false,
				};
			});
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
		} as IApiReturnWifi);
	}
	catch (error)
	{
		console.error('Error fetching block data:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch data' } as IApiReturnError,
			{ status: 500 },
		);
	}
}
