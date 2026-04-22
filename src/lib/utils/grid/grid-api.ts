import { BLOCK_SIZE, GLOBAL_GRID_CONFIG_PRECISION_MAKRER } from './grid-const';
import { IGeoBounds, IFormatBlockKey, IGeoCoord, IGpsLngLatMinMax, IMatchedBuckets } from './grid-types';
import {
	_minLngLatToRangeLngLatMinMax,
	calcBlockIdsInRange,
	calcGlobalBlockIndexAndCoord,
	getBucketSpecsFromAnyPoint,
	getRangeAndBlockIdsFromAnyCoordForMap,
} from './grid-utils-global';
import { decodeBlockKey } from '@/lib/utils/geo/geo-formatter';
import { _normalizeCoordScalarCore, normalizeCoord } from '@/lib/utils/geo/geo-transform';

console.dir(getRangeAndBlockIdsFromAnyCoordForMap({ lng: 121.499310, lat: 25.037682 }), { depth: null });

