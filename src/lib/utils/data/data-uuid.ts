import { IStationBase } from '@/types/station-base';
import { v5 as uuidv5 } from "uuid";
import { normalizeCoordToMarkerPrecision } from '../geo/geo-transform';

export function createDataUUID<T extends IStationBase>(value: T)
{

	const normalizedCoord = normalizeCoordToMarkerPrecision(value);

	return uuidv5(JSON.stringify({
		dataType: value.dataType,
		dataSource: value.dataSource,
		name: value.name,
		address: value.address,
		lng: normalizedCoord.lng,
		lat: normalizedCoord.lat,
	}), uuidv5.URL)
}
