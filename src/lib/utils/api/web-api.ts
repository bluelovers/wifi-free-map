import { IGpsCoordinate } from '../grid/grid-types';

/**
 * 開啟導航
 */
export function createNavigationUrl(coord: IGpsCoordinate): string
{
	return `https://www.google.com/maps/dir/?api=1&destination=${coord.lat},${coord.lng}`;
}
