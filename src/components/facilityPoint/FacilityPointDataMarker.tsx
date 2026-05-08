/**
 * 設施點資料地圖標記組件
 * Facility point data marker component
 *
 * 在地圖上以 Marker 顯示設施（WiFi 熱點 / 充電站），
 * 並提供 Popup 顯示詳細資訊與開啟地圖按鈕
 */
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

/**
 * 設施點地圖標記共用屬性
 * Facility point map marker shared props
 */
export interface IFacilityPointDataMarkerSharedProps<T extends IStationBase> extends IOpenMapButtonSharedProps<T>
{
	/** 點擊標記回呼 / Marker click callback */
	onClick?(item: T): void;

	/** 使用者目前位置（用於顯示距離）/ User's current position (for distance display) */
	position?: IGeoPointTupleLatLng;
}

/**
 * 設施點地圖標記屬性
 * Facility point map marker props
 */
export interface IFacilityPointDataMarkerProps<T extends IStationBase> extends IFacilityPointDataMarkerSharedProps<T>
{
	/** 設施資料列表 / Facility data list */
	list: T[];

	/** Leaflet 圖示（用於 Marker）/ Leaflet icon (for Marker) */
	icon?: L.Icon;

	/** React 圖示（用於 Popup）/ React icon (for Popup) */
	icon2?: React.JSX.Element;
}

/**
 * 設施點地圖標記屬性（含資料類型）
 * Facility point map marker props (with dataset type)
 */
export interface IFacilityPointDataMarkerWithTypeProps<T extends IStationBase> extends IFacilityPointDataMarkerProps<T>
{
	/** 資料類型 / Dataset type */
	dataType: T["dataType"];
}

/**
 * 設施點地圖標記屬性（所有類型）
 * Facility point map marker props (all types)
 */
export interface IFacilityPointDataMarkerAllProps<T extends IStationBase> extends IFacilityPointDataMarkerSharedProps<T>
{
	/** 所有類型的設施資料 / Facility data for all types */
	data: Partial<IApiReturnBlocksBatch["data"]>;
}

/**
 * 設施點地圖標記
 * Facility point map marker
 *
 * 在地圖上為每個設施產生 Marker，包含 Popup 顯示詳細資訊
 * Creates a Marker on the map for each facility, with a Popup showing details
 *
 * @typeParam T - 設施基礎型別 / Facility base type
 */
export function FacilityPointDataMarker<T extends IStationBase>(props: IFacilityPointDataMarkerWithTypeProps<T>)
{
	const positionCoord = props.position && wrapCoordinateFromPointTupleLatLng(props.position);

	return <>
		{props.list.map((item, index) => (
			<Marker
				key={item.id}
				data-uuid={item.id}

				position={item}
				icon={props.icon}
				eventHandlers={{
					/**
					 * 點擊 Marker 時記錄除錯資訊
					 * Log debug info when marker is clicked
					 */
					click: () =>
					{
						console.log(item.dataType, 'clicked', item);
					},
					/**
					 * 滑鼠移入時開啟 Popup
					 * Open popup on mouse hover
					 */
					mouseover: (e: L.LeafletMouseEvent) =>
					{
						console.log('Marker mouseover', e);

						e.target.openPopup();
					},
					/**
					 * 滑鼠移出時記錄除錯資訊
					 * Log debug info on mouse out
					 */
					mouseout: (e: L.LeafletMouseEvent) =>
					{
						console.log('Marker mouseout', e);

						//e.target.closePopup();
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
	</>
}

/**
 * 所有類型設施點地圖標記（含 Marker 聚合）
 * All types facility point map markers (with Marker clustering)
 *
 * 使用 MarkerClusterGroup 聚合大量標記，提升地圖效能
 * Uses MarkerClusterGroup to cluster large numbers of markers for better map performance
 */
export function FacilityPointDataMarkerAll({
	data,
	...props
}: IFacilityPointDataMarkerAllProps<IStationBase>)
{
	return (<>
		<MarkerClusterGroup
			chunkedLoading
			showCoverageOnHover
			zoomToBoundsOnClick={true}
			spiderfyOnMaxZoom
		>
			{data[EnumDatasetType.WIFI]?.length ? <FacilityPointDataMarker
				{...props}
				list={data[EnumDatasetType.WIFI]}
				dataType={EnumDatasetType.WIFI}
				icon={wifiIcon}
				icon2={<WifiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
			/> : null}
			{data[EnumDatasetType.CHARGING]?.length ? <FacilityPointDataMarker
				{...props}
				list={data[EnumDatasetType.CHARGING]}
				dataType={EnumDatasetType.CHARGING}
				icon={chargingIcon}
				icon2={<ThunderboltOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />}
			/> : null}
		</MarkerClusterGroup>
	</>)
}
