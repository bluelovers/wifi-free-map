/** @type {import('jest').Config} */
module.exports = {
  // 使用 ts-jest 直接編譯 TypeScript 測試檔案
  preset: 'ts-jest',
  testEnvironment: 'node',
  // 因為專案使用 ES 模組 (package.json type:"module")，需告訴 Jest 以 ESM 方式處理 .ts/.tsx
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  rootDir: '.',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        target: 'ES2017',
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        allowJs: true,
        checkJs: false,
        strict: true,
        skipLibCheck: true,
        baseUrl: '.',
        rootDir: '.',
        paths: {
          '@/*': ['src/*'],
        },
        // 忽略 TypeScript 6.0 的棄用警告
        ignoreDeprecations: '6.0',
      },
    }],
  },
  // 只執行 test 目錄下的 *.test.ts 檔案
  testMatch: ['**/test/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
