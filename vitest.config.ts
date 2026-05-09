import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {import('vite').CommonServerOptions} CommonServerOptions
 */

/** @type {CommonServerOptions} */
const api = {
  port: 53320, // 換一個數字試試，例如 63320
  host: '127.0.0.1', // 強制使用 IPv4
};

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
            api: api.port,
          },
        },
      },
    ],
    // fileParallelism: false,
    // isolate: false,
    testTimeout: 120000,
    // maxWorkers: 1,
    maxConcurrency: 1,

    api: api.port,

    watch: false,
  },

  // server: {
  //   port: 8080, // Changes the port for the browser runner
  // },
});
