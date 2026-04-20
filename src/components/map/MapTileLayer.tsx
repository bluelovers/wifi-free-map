import { MapContainer, MapContainerProps, TileLayer, TileLayerProps } from 'react-leaflet';
import { Map as LeafletMap, TileLayer as LeafletTileLayer } from 'leaflet';

const MAX_ZOOM = 25 as const;
const MAX_ZOOM_NATIVE = 19 as const;

export type IMapTileLayerProps = MapContainerProps
	& React.RefAttributes<LeafletMap>
	& {
		tileLayerProps?: TileLayerProps & React.RefAttributes<LeafletTileLayer>
	};

export function MapTileLayer(props: IMapTileLayerProps)
{
	return (
		<MapContainer
			{...props}
			scrollWheelZoom={props.scrollWheelZoom ?? true}
			maxZoom={props.maxZoom || MAX_ZOOM}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

				{...props.tileLayerProps}

				maxNativeZoom={MAX_ZOOM_NATIVE}
				maxZoom={MAX_ZOOM}
			/>
			{props.children}
		</MapContainer>
	);
}
