/**
 * 地圖圖磚圖層元件
 * Map tile layer component
 *
 * 提供带有多个地图来源选择器的 Leaflet 地圖容器
 * Provides a Leaflet map container with multiple map source options
 */
import { LayersControl, MapContainer, MapContainerProps, TileLayer, TileLayerProps } from 'react-leaflet';
import { Map as LeafletMap, TileLayer as LeafletTileLayer } from 'leaflet';

/** 最大縮放等級 / Maximum zoom level */
const MAX_ZOOM = 25 as const;
/** 原生最大縮放等級 / Native maximum zoom level */
const MAX_ZOOM_NATIVE = 19 as const;

/**
 * 地圖圖磚圖層屬性
 * Map tile layer properties
 *
 * 描述 MapTileLayer 元件所需的屬性
 * Describes properties required for MapTileLayer component
 */
export type IMapTileLayerProps = MapContainerProps
	& React.RefAttributes<LeafletMap>
	& {
	/** 圖磚層額外屬性 / Additional tile layer properties */
	tileLayerProps?: TileLayerProps & React.RefAttributes<LeafletTileLayer>
};

/**
 * 地圖圖磚來源列舉
 * Map tile source enumeration
 *
 * 定義可用的地圖圖磚來源
 * Defines available map tile sources
 */
const enum EnumMapTileLayer
{
	OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	/**
	 * https://github.com/cartodb/basemap-styles
	 *
	 * light_all
	 * dark_all
	 * light_nolabels
	 * light_only_labels
	 * dark_nolabels
	 * dark_only_labels
	 * rastertiles/voyager
	 * rastertiles/voyager_nolabels
	 * rastertiles/voyager_only_labels
	 * rastertiles/voyager_labels_under
	 */
	CARTO = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
	CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

export function MapTileLayer(props: IMapTileLayerProps)
{
	return (
		<MapContainer
			{...props}
			scrollWheelZoom={props.scrollWheelZoom ?? true}
			maxZoom={props.maxZoom || MAX_ZOOM}
		>
			<LayersControl position="topright">
				<LayersControl.BaseLayer name="詳細地圖 (OSM)">
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors'
						url={EnumMapTileLayer.OSM}

						{...props.tileLayerProps}

						maxNativeZoom={MAX_ZOOM_NATIVE}
						maxZoom={MAX_ZOOM}
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer checked name="淺色地圖 (Carto)">
					<TileLayer
						attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
						url={EnumMapTileLayer.CARTO}

						{...props.tileLayerProps}

						maxNativeZoom={MAX_ZOOM_NATIVE}
						maxZoom={MAX_ZOOM}
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer name="深色地圖 (Carto)">
					<TileLayer
						attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
						url={EnumMapTileLayer.CARTO_DARK}

						{...props.tileLayerProps}

						maxNativeZoom={MAX_ZOOM_NATIVE}
						maxZoom={MAX_ZOOM}
					/>
				</LayersControl.BaseLayer>
			</LayersControl>
			{props.children}
		</MapContainer>
	);
}
