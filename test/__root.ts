import path from 'upath2';
// @ts-ignore
import { __ROOT_CORE as __ROOT } from './__root-core.mts';

export { __ROOT }

export const isWin = process.platform === "win32";

export const __TEST_ROOT = path.join(__ROOT, 'test');
export const __TEST_FIXTURES = path.join(__TEST_ROOT, 'fixtures');
