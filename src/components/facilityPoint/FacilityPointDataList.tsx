import { formatToDD, getAndFormatDistance } from '@/lib/utils/geo/geo-formatter';
import { wrapCoordinateFromPointTupleLatLng } from '@/lib/utils/geo/geo-transform';
import { EnumDatasetType, IGeoPointTupleLatLng } from '@/lib/utils/grid/grid-types';
import { IApiReturnBlocksBatch } from '@/types';
import { IStationBase } from '@/types/station-base';
import { IChargingStation } from '@/types/station-charging';
import { IHotspot } from '@/types/station-wifi';
import { WifiOutlined, GlobalOutlined, CompassOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { IOpenMapButtonSharedProps, OpenMapButton } from '../map/map-btn/OpenMapButton';

/** 每次載入的熱點數量 / Number of hotspots to load per batch */
const PER_PAGE = 20;

export interface IFacilityPointDataListSharedProps<T extends IStationBase> extends IOpenMapButtonSharedProps<T>
{
	visiblePerPage?: number;

	onClick?(item: T): void;

	position?: IGeoPointTupleLatLng;
}

export interface IFacilityPointDataListProps<T extends IStationBase> extends IFacilityPointDataListSharedProps<T>
{
	list: T[];

	icon?: React.JSX.Element;
}

export interface IFacilityPointDataListWithTypeProps<T extends IStationBase> extends IFacilityPointDataListProps<T>
{
	dataType: T["dataType"];
}

export interface IFacilityPointDataListAllProps<T extends IStationBase> extends IFacilityPointDataListSharedProps<T>
{
	data: Partial<IApiReturnBlocksBatch["data"]>;
}

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

	const positionCoord = props.position && wrapCoordinateFromPointTupleLatLng(props.position);

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
			{props.list.slice(0, visibleCount).map((item, index) => (
				<Card
					key={item.id}
					data-uuid={item.id}

					className={`facility-item uuid-${item.id}`}

					hoverable
					variant="outlined"
					size="small"

					style={{
						cursor: 'pointer',
						width: 300,
						marginBottom: 10,
					}}
					onClick={(e) => {
						if (props.onClick)
						{
							e.stopPropagation();
							props.onClick(item);
						}
					}}
				>
					<Flex gap="small">
						{props.icon}
						<OpenMapButton item={item} onOpenMap={props.onOpenMap} />
					</Flex>
					<Flex vertical gap="zero">
						<Typography.Text strong>{item.name}</Typography.Text>
						{item.address && (
							<Typography.Text type="secondary" style={{ fontSize: '12px' }}>
								{item.address}
							</Typography.Text>
						)}
						<Typography.Text type="secondary" style={{ fontSize: '12px' }}>
							{formatToDD(item)}
							{
								positionCoord && ` • ${getAndFormatDistance(positionCoord, item)}`
							}
						</Typography.Text>
					</Flex>
				</Card>
			))}
		</Flex>
		{visibleCount < props.list.length && (
			<Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', padding: '8px' }}>
				還有 {props.list.length - visibleCount} 個熱點...
			</Typography.Text>
		)}
	</Card>);
}


export function FacilityPointDataListWifi<T extends IHotspot>(props: IFacilityPointDataListProps<T>)
{
	const icon = props.icon ?? <WifiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;

	return (<FacilityPointDataList
		{...props}

		dataType={EnumDatasetType.WIFI}
		icon={icon}

	/>)
}

export function FacilityPointDataListCharging<T extends IChargingStation>(props: IFacilityPointDataListProps<T>)
{
	const icon = props.icon ?? <ThunderboltOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />;

	return (<FacilityPointDataList
		{...props}

		dataType={EnumDatasetType.CHARGING}
		icon={icon}

	/>)
}

export function FacilityPointDataListAll({
	data,
	...props
}: IFacilityPointDataListAllProps<IStationBase>)
{
	return (<>
		{data[EnumDatasetType.WIFI]?.length && <FacilityPointDataListWifi
			{...props}
			list={data[EnumDatasetType.WIFI]}
		/>}
		{data[EnumDatasetType.CHARGING]?.length && <FacilityPointDataListCharging
			{...props}
			list={data[EnumDatasetType.CHARGING]}
		/>}
	</>)
}
