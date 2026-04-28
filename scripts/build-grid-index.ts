import { buildHierarchicalIndex } from '@/lib/utils/grid/grid-index-builder-v2';
import { __DATA_ROOT } from '@/lib/__root';

buildHierarchicalIndex(__DATA_ROOT)
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
