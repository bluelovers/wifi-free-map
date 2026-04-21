import { BLOCK_SIZE, GLOBAL_GRID_CONFIG_PRECISION_MAKRER } from './grid-const';
import { IBounds, IFormatBlockKey, IGpsCoordinate, IGpsLngLatMinMax, IMatchedBuckets } from './grid-types';
import { _croodToRange, _fixCoordCore, calcBlockIdsInRange, calcGlobalBlockIndexAndCoord, decodeBlockKey, fixCoord, getBucketSpecsFromAnyPoint, getRangeAndBlockIdsFromAnyCoordForMap } from './grid-utils-global';



console.dir(getRangeAndBlockIdsFromAnyCoordForMap({ lng: 121.499310, lat: 25.037682 }), { depth: null });

