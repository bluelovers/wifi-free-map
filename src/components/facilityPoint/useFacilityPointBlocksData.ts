import { useEffect, useMemo, useRef, useState } from 'react';
import { isCoordWithinRange } from '../../lib/utils/geo/geo-check';
import
	{
		transformCoordinateToUriQueryLatLng,
		wrapCoordinateFromPointTupleLatLng,
	} from '../../lib/utils/geo/geo-transform';
import { EnumDatasetType, IGeoCoord, IGeoPointTupleLatLng, IGpsLngLatMinMax } from '../../lib/utils/grid/grid-types';
import useSWR from 'swr';
import { IApiReturnBlocksBatch } from '../../types/index';
import { buildFetcher, fetcher } from '../../lib/utils/fetch/fetcher';
import { getSnappedCoord } from '@/lib/utils/geo/geo-bounds-utils';
import { IRefObjectMaybe, unwrapRefObject } from '@/lib/utils/react/var-helper';

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

export function useFacilityPointBlocksData(position: IGeoPointTupleLatLng | IGeoCoord, ignoreCheck?: IRefObjectMaybe<boolean>)
{
	/**
	 * 使用 useRef 記憶邊界。
	 * 因為邊界是用來判斷「要不要發請求」，它不需要觸發 re-render，
	 * 真正的 re-render 應該由 SWR 的 data 更新來驅動。
	 */
	const boundsRef = useRef<{
		trigger?: IGpsLngLatMinMax | null;
	}>({});

	/**
	 * 只有在需要更新時，才產生新的 Key
	 * 我們利用一個 state 來鎖定「當前生效的請求 Key」
	 */
	const [activeKey, setActiveKey] = useState<string | null>(null);

	/**
	 * 處理 position 變化邏輯
	 */
	useEffect(() =>
	{
		if (!position) return;

		const coord = Array.isArray(position) ? wrapCoordinateFromPointTupleLatLng(position) : position;
		const snappedCenter = getSnappedCoord(coord);
		const triggerBounds = boundsRef.current.trigger;

		const shouldIgnoreCheck = unwrapRefObject(ignoreCheck);

		const shouldTrigger = shouldIgnoreCheck || !triggerBounds ||
			!isCoordWithinRange(coord, triggerBounds) ||
			!isCoordWithinRange(snappedCenter, triggerBounds);

		if (shouldTrigger)
		{
			const newKey = `/api/blocks-batch?${transformCoordinateToUriQueryLatLng(snappedCenter)}`;
			/** 只有當計算出的 Key 不同時，才更新 state 觸發 SWR */
			if (newKey !== activeKey)
			{
				setActiveKey(newKey);
			}
		}
	}, [position]);

	/**
	 * SWR 主體
	 */
	const { data: batchData, error, isLoading } = useSWR<IApiReturnBlocksBatch>(activeKey, fetcher, {
		revalidateOnFocus: false,
		/**
		 * 這裡可以直接在回傳時同步更新 Ref，不會觸發額外的 render
		 */
		onSuccess: (res) =>
		{
			boundsRef.current.trigger = res.triggerThresholdRangeBounds;
		},
	});

	/**
	 * 衍生資料 (Derived State)
	 * 使用 useMemo 確保回傳物件的引用穩定
	 */
	return useMemo(() => ({
		data: fillFacilityPointData(batchData?.data),
		matchedRangeBounds: batchData?.matchedRangeBounds ?? null,
		triggerThresholdRangeBounds: batchData?.triggerThresholdRangeBounds ?? null,
		blockScanRangeBounds: batchData?.blockScanRangeBounds ?? null,
		categories: batchData?.categories ?? [],
		error,
		isLoading,
	}), [batchData, error, isLoading]);
}
