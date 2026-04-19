/**
 * 區塊化充電站資料 API
 * Block-based charging station data API
 */
import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { calcGlobalBlockIndexAndCoord, _formatBlockKey, calcCoordToBucketIndexAndCoord } from '@/lib/utils/grid/grid-utils-global';
import { __DATA_ROOT } from '@/lib/__root';

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
			{ status: 400 }
		);
	}

	const lat = parseFloat(latStr);
	const lng = parseFloat(lngStr);

	if (isNaN(lat) || isNaN(lng))
	{
		return NextResponse.json(
			{ success: false, error: 'Invalid coordinate' },
			{ status: 400 }
		);
	}

	try
	{
		const blockData = calcGlobalBlockIndexAndCoord({ lng, lat });
		const bucketData = calcCoordToBucketIndexAndCoord({ lng, lat });

		const blockKey = _formatBlockKey(blockData.minLng, blockData.minLat);
		const bucketKey = _formatBlockKey(bucketData.bucketCoord.lng, bucketData.bucketCoord.lat, { sep: '/' });

		const blockPath = join(__DATA_ROOT, 'grid-charging', bucketKey, `${blockKey}.json`);

		let chargingData: unknown[] = [];

		try
		{
			const content = await readFile(blockPath, 'utf-8');
			const json = JSON.parse(content);
			chargingData = (json.charging as unknown[]) || json.data as unknown[] || [];
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
		});
	}
	catch (error)
	{
		console.error('Error:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed' },
			{ status: 500 }
		);
	}
}