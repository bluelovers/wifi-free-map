import { isSameCoord, isSameCoordCore } from '@/lib/utils/geo/geo-check';
import { normalizeCoordToMarkerPrecision } from '@/lib/utils/geo/geo-transform';
import { IGeoCoord } from '@/lib/utils/grid/grid-types';
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';

export interface IMapMoveHandlerComponentProps
{
	onChange?(coord: IGeoCoord, lastCenterPosition: IGeoCoord | null): void;
	debounce?: number;
}

export interface IMapMoveHandlerRefEventsOptions extends IMapMoveHandlerComponentProps
{
	mapRef: React.RefObject<L.Map | null>;
}

export interface IMapMoveHandlerEventsOptions extends IMapMoveHandlerComponentProps
{
	getMap(): L.Map | null;
}

export interface IMapMoveHandlerInternalOptions extends IMapMoveHandlerComponentProps
{
	center: IGeoCoord;
	debounceTimerRef?: React.RefObject<number | null>;
	lastPositionRef: React.RefObject<{ lat: number; lng: number } | null>;
}

export function _processMapMoveEnd(props: IMapMoveHandlerInternalOptions)
{
	let { center, lastPositionRef, onChange, debounceTimerRef, debounce } = props;
	center = normalizeCoordToMarkerPrecision(center);

	/** 檢查是否真的改變 */
	if (lastPositionRef.current && isSameCoordCore(lastPositionRef.current, center))
	{
		console.log('[MapMoveHandler] 位置没变', '目前位置:', center, ', 之前位置:', lastPositionRef.current);

		return;
	}

	console.log('[MapMoveHandler] 位置改变', '目前位置:', center, ', 之前位置:', lastPositionRef.current);

	const lastCenterPosition = lastPositionRef.current ? normalizeCoordToMarkerPrecision(lastPositionRef.current) : null;

	lastPositionRef.current = center;

	/**
	 * debounce 控制
	 */
	if (debounceTimerRef?.current) clearTimeout(debounceTimerRef.current);

	if (!!onChange)
	{
		if (debounce! >= 0 && debounceTimerRef)
		{
			debounceTimerRef.current = window.setTimeout(() =>
			{
				onChange!(center, lastCenterPosition);
			}, debounce)
		}
		else
		{
			onChange!(center, lastCenterPosition);
		}
	}
}

export function useMapEvents(props: IMapMoveHandlerEventsOptions)
{
	const lastPositionRef = useRef<IGeoCoord | null>(null);
	const debounceTimerRef = useRef<number | null>(null);

	useEffect(() =>
	{
		const map = props.getMap();
		if (!map) return;

		const handleMoveEnd = () =>
		{
			_processMapMoveEnd({
				...props,
				center: map.getCenter(),
				lastPositionRef,
				debounceTimerRef,
			});
		};

		map.on("moveend", handleMoveEnd);
		map.on("zoomend", handleMoveEnd);

		return () =>
		{
			map.off("moveend", handleMoveEnd);
			map.off("zoomend", handleMoveEnd);
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [props.getMap, props.onChange, props.debounce]);
}

export const MapMoveHandler: React.FC<IMapMoveHandlerComponentProps> = (props) =>
{
	const map = useMap();

	useMapEvents({
		...props,
		getMap: () => map,
	});

	return null;
};

export function useMapMove(props: IMapMoveHandlerComponentProps)
{
	const map = useMap();
	const [center, setCenter] = useState<IGeoCoord | null>(null);

	useMapEvents({
		...props,
		getMap: () => map,
		onChange(coord, lastCenterPosition)
		{
			setCenter(coord);
			props.onChange?.(coord, lastCenterPosition);
		},
	});

	return center;
}

export function useMapRefEvents(props: IMapMoveHandlerRefEventsOptions)
{
	useMapEvents({
		...props,
		getMap: () => props.mapRef.current,
	});
}
