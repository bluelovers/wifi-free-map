import { ISvgGpsPulseProps, createGpsPulseDivIcon, customGpsIcon2 } from '@/components/icon/svg';
import { CircleMarker, Marker, MarkerProps } from 'react-leaflet';
import { LatLngExpression, Marker as LeafletMarker } from 'leaflet';

function CircleMarkerX2(props: { position: LatLngExpression })
{
	return <>
		{/* 使用者位置 - 藍色半透明圓圈 */}
		<CircleMarker
			center={props.position}
			radius={25}
			className="gps-pulse"
			pathOptions={{
				color: '#1890ff',
				fillColor: '#c70eeb',
				fillOpacity: 0.3,
				weight: 1,
			}}
		/>
		{/* 内圈 - 中心實心圓 */}
		<CircleMarker
			center={props.position}
			radius={10}
			pathOptions={{
				color: '#1890ff',
				fillColor: '#1890ff',
				fillOpacity: 0.7,
				weight: 2,
			}}
		/>
	</>
}

export function CircleMarkerSVG(props: MarkerProps & React.RefAttributes<LeafletMarker> & ISvgGpsPulseProps)
{
	return <>
		<Marker
			{...props}
			draggable={props.draggable ?? true}
			icon={createGpsPulseDivIcon(props)}
		>
			{props.children}
		</Marker>
	</>
}
