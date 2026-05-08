/**
 * 設施點區塊資料 Hook
 * Facility point blocks data hook
 *
 * 根據使用者位置自動發送 API 請求取得設施區塊資料，
 * 並在超出觸發邊界時重新請求
 * Automatically fetches facility block data based on user position,
 * re-fetching when the trigger threshold boundary is exceeded
 */
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
import { IRefObjectMaybe, unwrapRefObject } from '@/lib/utils/react/var-helper-pure';

/**
 * 填補設施點資料，確保各類型至少為空陣列
 * Fill facility point data, ensuring each type is at least an empty array
 *
 * @param data - 原始 API 回傳資料 / Raw API response data
 * @returns 填補後的資料 / Filled data
 */
function fillFacilityPointData(data?: IApiReturnBlocksBatch["data"]): IApiReturnBlocksBatch["data"]
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

/**
 * 取得設施點區塊資料
 * Get facility point blocks data
 *
 * 監聽 position 變化，當超出觸發邊界時透過 SWR 發送請求，
 * 回傳設施資料與各種邊界範圍資訊
 * Listens to position changes and sends requests via SWR when the trigger boundary is exceeded,
 * returning facility data and various boundary range information
 *
 * @param position - 使用者目前座標 / User's current position
 * @param ignoreCheck - 可選：忽略邊界檢查強制觸發 / Optional: force trigger by ignoring boundary check
 * @returns 設施資料與邊界範圍 / Facility data and boundary ranges
 */
export function useFacilityPointBlocksData(position: IGeoPointTupleLatLng | IGeoCoord,
	ignoreCheck?: IRefObjectMaybe<boolean>,
)
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
