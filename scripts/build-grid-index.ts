import { buildHierarchicalIndex } from '@/lib/utils/grid/grid-index-builder-v2';
import { resolve } from 'path';
import { __ROOT } from '../test/__root';

buildHierarchicalIndex(resolve(__ROOT, `public/data/`))
	.then(() =>
	{
		// console.log('Index build completed');
	})
	.catch((error) =>
	{
		console.error('Index build failed:', error);
		process.exit(1);
	});
;
