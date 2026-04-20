/**
 * 區塊化充電站資料 API
 * Block-based charging station data API
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
import { IChargingStation as IChargingStationBase } from '@/types/station-charging';
import { IChargingStation, IApiReturnCharging, IApiReturnError } from '@/types';

/**
 * GET /api/charging-block?lat=xxx&lng=xxx
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
		const blockData = calcGlobalBlockIndexAndCoord({ lng, lat });
		const bucketData = calcCoordToBucketIndexAndCoord({ lng, lat });

		const blockKey = _formatBlockKey(blockData.minLng, blockData.minLat);
		const bucketKey = _formatBlockKey(bucketData.bucketCoord.lng, bucketData.bucketCoord.lat, { sep: '/' });

		const blockPath = join(__DATA_ROOT, 'grid-charging', bucketKey, `${blockKey}.json`);

		/** 充電站資料（IChargingStation 結構） */
		let chargingData: IChargingStation[] = [];

		try
		{
			const blockJson: IChargingStationBase[] = await readFile(blockPath, 'utf-8').then(JSON.parse);

			/** 將 IChargingStationBase 轉換為 IChargingStation */
			chargingData = blockJson.map((item, index) =>
			{
				return {
					...item,
					id: `${item.lng}_${item.lat}_${index}`,
					source: 'osm' as const,
					isFree: true,
					details: '',
					socketTypes: [],
					openingHours: '',
				};
			});
		}
		catch
		{
			// block not found
		}

		return NextResponse.json({
			success: true,
			data: chargingData,
			block: {
				lng: blockData.minLng,
				lat: blockData.minLat,
				path: `/data/grid-charging/${bucketKey}/${blockKey}.json`,
				count: chargingData.length,
			},
		} as IApiReturnCharging);
	}
	catch (error)
	{
		console.error('Error:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed' } as IApiReturnError,
			{ status: 500 },
		);
	}
}
