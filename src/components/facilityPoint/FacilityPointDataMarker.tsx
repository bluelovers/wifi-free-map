import { GlobalOutlined, CompassOutlined, ThunderboltOutlined, WifiOutlined } from '@ant-design/icons';
import { Flex, Button, Typography } from 'antd';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { chargingIcon, wifiIcon } from '../icon/leaflet';
import { IStationBase } from '@/types/station-base';
import { Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { IApiReturnBlocksBatch } from '@/types';
import { EnumDatasetType, IGeoPointTupleLatLng } from '@/lib/utils/grid/grid-types';
import { IOpenMapButtonSharedProps, OpenMapButton } from '../map/map-btn/OpenMapButton';
import { formatToDD, getAndFormatDistance } from '@/lib/utils/geo/geo-formatter';
import { wrapCoordinateFromPointTupleLatLng } from '@/lib/utils/geo/geo-transform';

export interface IFacilityPointDataMarkerSharedProps<T extends IStationBase> extends IOpenMapButtonSharedProps<T>
{
	onClick?(item: T): void;

	position?: IGeoPointTupleLatLng;
}

export interface IFacilityPointDataMarkerProps<T extends IStationBase> extends IFacilityPointDataMarkerSharedProps<T>
{
	list: T[];

	icon?: L.Icon;
	icon2?: React.JSX.Element;
}

export interface IFacilityPointDataMarkerWithTypeProps<T extends IStationBase> extends IFacilityPointDataMarkerProps<T>
{
	dataType: T["dataType"];
}

export interface IFacilityPointDataMarkerAllProps<T extends IStationBase> extends IFacilityPointDataMarkerSharedProps<T>
{
	data: Partial<IApiReturnBlocksBatch["data"]>;
}

export function FacilityPointDataMarker<T extends IStationBase>(props: IFacilityPointDataMarkerWithTypeProps<T>)
{
	const positionCoord = props.position && wrapCoordinateFromPointTupleLatLng(props.position);

	return <>
		<MarkerClusterGroup
			chunkedLoading
		>
			{props.list.map((item, index) => (
				<Marker
					key={item.id}
					data-uuid={item.id}

					position={item}
					icon={props.icon}
					eventHandlers={{
						click: () =>
						{
							console.log(item.dataType, 'clicked', item);
						},
						mouseover: (e: L.LeafletMouseEvent) =>
						{
							console.log('Marker mouseover', e);

							e.target.openPopup();
						},
						mouseout: (e: L.LeafletMouseEvent) =>
						{
							console.log('Marker mouseout', e);

							e.target.closePopup();
						},
					}}
				>
					{/** leaflet-popup */}
					<Popup
						data-uuid={item.id}
						className={`facility-item-map-popup uuid-${item.id}`}
					>
						<Flex vertical gap="small">
							<Flex vertical gap="zero">
								{props.icon2}
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
							<Flex gap="small">
								<OpenMapButton item={item} onOpenMap={props.onOpenMap} />
							</Flex>
						</Flex>
					</Popup>
				</Marker>
			))}
		</MarkerClusterGroup>
	</>
}

export function FacilityPointDataMarkerAll({
	data,
	...props
}: IFacilityPointDataMarkerAllProps<IStationBase>)
{
	return (<>
		{data[EnumDatasetType.WIFI]?.length && <FacilityPointDataMarker
			{...props}
			list={data[EnumDatasetType.WIFI]}
			dataType={EnumDatasetType.WIFI}
			icon={wifiIcon}
			icon2={<WifiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
		/>}
		{data[EnumDatasetType.CHARGING]?.length && <FacilityPointDataMarker
			{...props}
			list={data[EnumDatasetType.CHARGING]}
			dataType={EnumDatasetType.CHARGING}
			icon={chargingIcon}
			icon2={<ThunderboltOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />}
		/>}
	</>)
}
