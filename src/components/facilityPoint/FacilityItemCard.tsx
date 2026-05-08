/**
 * 設施項目卡片子組件
 * Facility item card sub-component
 *
 * 自 FacilityPointDataList 切割出的單一設施卡片
 * 可獨立展示在 Storybook 中，無需 Leaflet 或地圖上下文
 * Extracted from FacilityPointDataList as a standalone card
 * Can be displayed independently in Storybook without Leaflet or map context
 */
import React from 'react';
import { Card, Flex, Typography } from 'antd';
import { IStationBase } from '@/types/station-base';
import { IOpenMapButtonSharedProps, OpenMapButton } from '@/components/map/map-btn/OpenMapButton';
import { formatToDD, getAndFormatDistance } from '@/lib/utils/geo/geo-formatter';
import { IGeoPointTupleLatLng } from '@/lib/utils/grid/grid-types';
import { wrapCoordinateFromPointTupleLatLng } from '@/lib/utils/geo/geo-transform';
import { IFacilityPointDataListSharedProps } from './FacilityPointDataList';

export interface IFacilityItemCardProps<T extends IStationBase> extends IOpenMapButtonSharedProps<T>, Pick<IFacilityPointDataListSharedProps<T>, 'onClick' | 'position'>
{
	/** 設施資料 / Facility data */
	item: T;

	/** 圖示（可選）/ Icon (optional) */
	icon?: React.ReactNode;

	/** 自訂 CSS 類別名稱 / Custom CSS class name */
	className?: string;
}

/**
 * 設施項目卡片
 * Facility item card
 *
 * 顯示單個設施的名稱、地址、座標與距離
 * Displays a single facility's name, address, coordinates, and distance
 */
export function FacilityItemCard<T extends IStationBase>(props: IFacilityItemCardProps<T>)
{
	const { item, icon, onOpenMap, onClick, position, ...rest } = props;
	const positionCoord = position && wrapCoordinateFromPointTupleLatLng(position);

	return (
		<Card
			hoverable
			variant="outlined"
			size="small"
			style={{
				cursor: 'pointer',
				width: 300,
				marginBottom: 10,
			}}
			onClick={(e) =>
			{
				if (onClick)
				{
					e.stopPropagation();
					onClick(item);
				}
			}}
			{...rest}
		>
			<Flex gap="small">
				{icon}
				<OpenMapButton item={item} onOpenMap={onOpenMap} />
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
					{positionCoord && ` • ${getAndFormatDistance(positionCoord, item)}`}
				</Typography.Text>
			</Flex>
		</Card>
	);
}
