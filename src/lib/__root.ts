import { join } from 'path';
// @ts-ignore
import { __ROOT_CORE as __ROOT } from './__root-core.mts';

export { __ROOT }

export const isWin = process.platform === "win32";

export const __DATA_ROOT = join(__ROOT, 'public/data');

export const __TEST_ROOT = join(__ROOT, 'test');
export const __TEST_FIXTURES = join(__TEST_ROOT, 'fixtures');
