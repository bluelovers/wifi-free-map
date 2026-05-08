/**
 * 設施點資料列表組件
 * Facility point data list component
 *
 * 提供設施（WiFi 熱點 / 充電站）的列表顯示與分頁載入功能
 * Provides list display and paginated loading for facilities (WiFi hotspots / charging stations)
 */
import { EnumDatasetType, IGeoCoord, IGeoPointTupleLatLng } from '@/lib/utils/grid/grid-types';
import { IApiReturnBlocksBatch } from '@/types';
import { IStationBase } from '@/types/station-base';
import { IChargingStation } from '@/types/station-charging';
import { IHotspot } from '@/types/station-wifi';
import { WifiOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Card, Flex, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import { IOpenMapButtonSharedProps } from '../map/map-btn/OpenMapButton';
import { _createProximityComparator } from '@/lib/utils/geo/geo-sort.';
import { calculateDistance } from '@/lib/utils/geo/geo-math';
import { FacilityItemCard } from './FacilityItemCard';

/** 每次載入的熱點數量 / Number of hotspots to load per batch */
const PER_PAGE = 20;

export interface IFacilityPointDataListSharedProps<T extends IStationBase> extends IOpenMapButtonSharedProps<T>
{
	/** 每頁顯示的項目數量 / Items per page */
	visiblePerPage?: number;

	/** 點擊卡片回呼 / Click callback */
	onClick?(item: T): void;

	/** 使用者目前位置（用於顯示距離）/ User's current position (for distance display) */
	position?: IGeoPointTupleLatLng;

	/** 地圖中心點（用於距離排序）/ Map center (for distance sorting) */
	mapCenter?: IGeoCoord;
}

export interface IFacilityPointDataListProps<T extends IStationBase> extends IFacilityPointDataListSharedProps<T>
{
	/** 設施資料列表 / Facility data list */
	list: T[];

	/** 自訂圖示（可選）/ Custom icon (optional) */
	icon?: React.JSX.Element;
}

export interface IFacilityPointDataListWithTypeProps<T extends IStationBase> extends IFacilityPointDataListProps<T>
{
	/** 資料類型 / Dataset type */
	dataType: T["dataType"];
}

export interface IFacilityPointDataListAllProps<T extends IStationBase> extends IFacilityPointDataListSharedProps<T>
{
	/** 所有類型的設施資料 / Facility data for all types */
	data: Partial<IApiReturnBlocksBatch["data"]>;
}

/**
 * 根據資料類型取得列表標題
 * Get list title by dataset type
 *
 * @param type - 資料類型 / Dataset type
 * @returns 列表標題字串 / List title string
 */
function getTitleByType(type: EnumDatasetType)
{
	switch (type)
	{
		case EnumDatasetType.WIFI:
			return 'WiFi 熱點列表';
		case EnumDatasetType.CHARGING:
			return '充電站列表';
		default:
			return `${type} 列表`;
	}
}

/**
 * 設施點資料列表
 * Facility point data list
 *
 * 顯示指定類型的設施卡片列表，支援按距離排序與滾動分頁載入
 * Displays a list of facility cards for a specified type, with distance sorting and scroll-based pagination
 *
 * @typeParam T - 設施基礎型別 / Facility base type
 */
export function FacilityPointDataList<T extends IStationBase>(props: IFacilityPointDataListWithTypeProps<T>)
{
	const visiblePerPage = props.visiblePerPage ?? PER_PAGE;

	/** 顯示的熱點數量（分頁用）/ Number of visible hotspots (for pagination) */
	const [visibleCount, setVisibleCount] = useState(visiblePerPage);

	// /** 當過濾條件改變時重置顯示數量 / Reset visible count when filters change */
	// useEffect(() =>
	// {
	// 	setVisibleHotspotCount(defaultDisplayCount);
	// }, [searchTerm, filters]);

	const list = useMemo(() =>
	{
		if (props.mapCenter)
		{
			let list = props.list.sort(_createProximityComparator(props.mapCenter, calculateDistance));

			console.log('[filteredFacilityPointDataList] facility point:', list.length,
				'\nmapCenter:', props.mapCenter,
				'\nfiltered.length:', list.length,
				'\nfiltered(0, 5):', list.slice(0, 5),
				'\nfiltered(-5):', list.slice(-5),
			);

			return list;
		}
		return props.list
	}, [props.list, props.mapCenter])

	return (<Card
		className="bottom-panel"
		style={{
			maxHeight: '320px',
			// overflow: 'visible',
			overflow: 'auto',
		}}
		title={`${getTitleByType(props.dataType)} (${props.list.length})`}
		size="small"
		hoverable

		onScroll={(e) =>
		{
			/** 捲動到底部時載入更多 / Load more when scrolled to bottom */
			const target = e.target as HTMLDivElement;
			const scrollBottom = target.scrollTop + target.clientHeight;
			if (scrollBottom >= target.scrollHeight - 50)
			{
				/** 載入更多熱點 / Load more hotspots */
				if (visibleCount < props.list.length)
				{
					setVisibleCount(prev => prev + visiblePerPage);
				}
			}
		}}
	>
		<Flex
			className="facility-list"
			wrap
			justify={'space-around'}
			align="flex-start"
		>
			{list.slice(0, visibleCount).map((item) => (
				<FacilityItemCard
					key={item.id}
					item={item}
					icon={props.icon}
					onOpenMap={props.onOpenMap}
					onClick={props.onClick}
					position={props.position}
					data-uuid={item.id}
					className={`facility-item uuid-${item.id}`}
				/>
			))}
		</Flex>
		{visibleCount < props.list.length && (
			<Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', padding: '8px' }}>
				還有 {props.list.length - visibleCount} 個熱點...
			</Typography.Text>
		)}
	</Card>);
}

/** WiFi 預設圖示 / WiFi default icon */
export const defaultIconWifi = <WifiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;

/** 充電站預設圖示 / Charging station default icon */
export const defaultIconCharging = <ThunderboltOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />;

/**
 * WiFi 熱點資料列表（含預設圖示）
 * WiFi hotspot data list (with default icon)
 *
 * @typeParam T - WiFi 熱點型別 / WiFi hotspot type
 */
export function FacilityPointDataListWifi<T extends IHotspot>(props: IFacilityPointDataListProps<T>)
{
	const icon = props.icon ?? defaultIconWifi;

	return (<FacilityPointDataList
		{...props}

		dataType={EnumDatasetType.WIFI}
		icon={icon}

	/>)
}

/**
 * 充電站資料列表（含預設圖示）
 * Charging station data list (with default icon)
 *
 * @typeParam T - 充電站型別 / Charging station type
 */
export function FacilityPointDataListCharging<T extends IChargingStation>(props: IFacilityPointDataListProps<T>)
{
	const icon = props.icon ?? defaultIconCharging;

	return (<FacilityPointDataList
		{...props}

		dataType={EnumDatasetType.CHARGING}
		icon={icon}

	/>)
}

/**
 * 所有類型設施點資料列表
 * All types facility point data list
 *
 * 同時顯示 WiFi 與充電站資料（若存在）
 * Displays both WiFi and charging station data if available
 */
export function FacilityPointDataListAll({
	data,
	...props
}: IFacilityPointDataListAllProps<IStationBase>)
{
	return (<>
		{data[EnumDatasetType.WIFI]?.length ? <FacilityPointDataListWifi
			{...props}
			list={data[EnumDatasetType.WIFI]}
		/> : null}
		{data[EnumDatasetType.CHARGING]?.length ? <FacilityPointDataListCharging
			{...props}
			list={data[EnumDatasetType.CHARGING]}
		/> : null}
	</>)
}
