/**
 * 位置座標顯示元件
 * Position coordinate display component
 *
 * 自 FacilityMap.tsx 抽離，顯示含標籤的經緯度座標文字
 * Extracted from FacilityMap.tsx — displays labelled lat/lng coordinate text
 */
import { Typography } from 'antd';
import { IGeoPointTupleLatLng } from '@/lib/utils/grid/grid-types';
import { GLOBAL_GRID_CONFIG_PRECISION_MAKRER } from '@/lib/utils/grid/grid-const';
import { ComponentProps } from 'react';

export interface IPositionCoordDisplayProps extends Omit<ComponentProps<typeof Typography.Text>, 'children'>
{
	/** 位置座標（[lat, lng]）/ Position coordinates ([lat, lng]) */
	position: IGeoPointTupleLatLng;
	/** 座標小數位數 / Coordinate decimal places */
	precision?: number;
	/** 座標標籤文字 / Coordinate label text */
	label?: string;
}

/**
 * 位置座標顯示
 * Position coordinate display
 *
 * 顯示格式化後的經緯度座標，預設格式：座標: 25.033000, 121.565400
 * Displays formatted lat/lng coordinates, default format: 座標: 25.033000, 121.565400
 */
export function PositionCoordDisplay(props: IPositionCoordDisplayProps)
{
	const { position, precision = GLOBAL_GRID_CONFIG_PRECISION_MAKRER, label = '座標', ...textProps } = props;

	return (
		<Typography.Text {...textProps} >
			{label}: {position[0].toFixed(precision)}, {position[1].toFixed(precision)}
		</Typography.Text>
	);
}
