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
	const [facilityPointRangeBounds, setFacilityPointRangeBounds] = useState<IGpsLngLatMinMax | null>(null);

	const [facilityPointData, setFacilityPointData] = useState<IApiReturnBlocksBatch["data"] | null>(fillFacilityPointData());

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

		const bool = !facilityPointRangeBounds || !isCoordWithinRange(coord, facilityPointRangeBounds);

		if (bool)
		{
			swrKey = `/api/blocks-batch?${transformCoordinateToUriQueryLatLng(coord)}`;
		}

		console.log('useFacilityPointBlocksData', swrKey, position, facilityPointRangeBounds, bool);
	}

	const fetcherWithLogging = buildFetcher<IApiReturnBlocksBatch, {
		facilityPointData: IApiReturnBlocksBatch["data"],
		facilityPointRangeBounds: IApiReturnBlocksBatch["matchedRange"],
	}>(fetcher, {
		onSuccess(data)
		{
			console.log('[useFacilityPointBlocksData] API response:', data.success,
				'\nwifi count:', data.data?.[EnumDatasetType.WIFI]?.length,
				'\ncharging count:', data.data?.[EnumDatasetType.CHARGING]?.length,
				'\nrange:', data.matchedRange,
			);

			return {
				facilityPointData: fillFacilityPointData(data?.data),
				facilityPointRangeBounds: data.matchedRange,
			} as const;
		},
	});

	const { data, error, isLoading } = useSWR(swrKey, fetcherWithLogging, {
		revalidateOnFocus: false,
		onSuccess: (batchData) =>
		{
			if (batchData.facilityPointRangeBounds)
			{
				setFacilityPointRangeBounds(batchData.facilityPointRangeBounds);
			}

			if (batchData.facilityPointData)
			{
				setFacilityPointData(batchData.facilityPointData);
			}

			console.log('[useFacilityPointBlocksData]', batchData.facilityPointData);
		},
	});

	return {
		facilityPointData,
		facilityPointRangeBounds,
		facilityPointRangeError: error,
		facilityPointRangeLoading: isLoading,
	} as const;
}
