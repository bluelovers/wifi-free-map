import { useMemo, useState } from 'react';
import { isCoordWithinRange } from '../../lib/utils/geo/geo-check';
import {
	transformCoordinateToUriQueryLatLng,
	transformPointTupleLatLngToUriQueryLatLng,
	wrapCoordinateFromPointTupleLatLng,
} from '../../lib/utils/geo/geo-transform';
import { EnumDatasetType, IGeoCoord, IGeoPointTupleLatLng, IGpsLngLatMinMax } from '../../lib/utils/grid/grid-types';
import useSWR from 'swr';
import { IApiReturnBlocksBatch, IApiReturnError } from 'src/types/index';
import { buildFetcher, fetcher } from '../../lib/utils/fetch/fetcher';
import { getSnappedCoord } from '@/lib/utils/geo/geo-bounds-utils';

function fillFacilityPointData(data?: IApiReturnBlocksBatch["data"])
{

	const facilityPointData = data ?? {} as IApiReturnBlocksBatch["data"];

	[
		EnumDatasetType.WIFI,
		EnumDatasetType.CHARGING,
	].forEach(type =>
	{
		facilityPointData[type] ??= [];
	});

	return facilityPointData;
}

export function useFacilityPointBlocksData(position: IGeoPointTupleLatLng | IGeoCoord)
{
	/** 當前資料的範圍邊界 / Current data range bounds */
	const [matchedRangeBounds, setMatchedRangeBounds] = useState<IGpsLngLatMinMax | null>(null);

	const [triggerThresholdRangeBounds, setTriggerThresholdRangeBounds] = useState<IGpsLngLatMinMax | null>(null);
	const [blockScanRangeBounds, setBlockScanRangeBounds] = useState<IGpsLngLatMinMax | null>(null);

	const [data, setData] = useState<IApiReturnBlocksBatch["data"] | null>(fillFacilityPointData());

	let swrKey = null;
	if (position)
	{
		let coord: IGeoCoord;

		if (Array.isArray(position))
		{
			coord = wrapCoordinateFromPointTupleLatLng(position);
		}
		else
		{
			coord = position;
		}

		const snappedCenter = getSnappedCoord(coord);

		const bool = !triggerThresholdRangeBounds
			|| !isCoordWithinRange(coord, triggerThresholdRangeBounds)
			|| !isCoordWithinRange(snappedCenter, triggerThresholdRangeBounds)
		;

		if (bool)
		{
			swrKey = `/api/blocks-batch?${transformCoordinateToUriQueryLatLng(snappedCenter)}`;
		}

		console.log('useFacilityPointBlocksData', swrKey, position, triggerThresholdRangeBounds, bool);
	}

	const fetcherFacilityPoint = buildFetcher<IApiReturnBlocksBatch>(fetcher, {
		onSuccess(data)
		{
			console.log('[useFacilityPointBlocksData] API response:', data.success,
				'\nwifi count:', data.data?.[EnumDatasetType.WIFI]?.length,
				'\ncharging count:', data.data?.[EnumDatasetType.CHARGING]?.length,
				'\nrange:', data.matchedRangeBounds,
			);

			return data;
		},
	});

	const { error, isLoading } = useSWR(swrKey, fetcherFacilityPoint, {
		revalidateOnFocus: false,
		onSuccess: (batchData) =>
		{
			if (batchData.matchedRangeBounds)
			{
				setMatchedRangeBounds(batchData.matchedRangeBounds);
			}

			if (batchData.triggerThresholdRangeBounds)
			{
				setTriggerThresholdRangeBounds(batchData.triggerThresholdRangeBounds);
			}

			if (batchData.blockScanRangeBounds)
			{
				setBlockScanRangeBounds(batchData.blockScanRangeBounds);
			}

			if (batchData.data)
			{
				setData(batchData.data);
			}
		},
	});

	return {
		data,
		matchedRangeBounds,
		triggerThresholdRangeBounds,
		blockScanRangeBounds,
		error,
		isLoading,
	} as const;
}
