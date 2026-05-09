import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
	"stories": [
		"../src/**/*.mdx",
		"../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	"addons": [
		"@chromatic-com/storybook",
		{
			name: "@storybook/addon-vitest",

			options: {
				// 將啟動超時時間增加到 60 秒或更長
				testRunnerStartTimeout: 120000,
			},

		},
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"@storybook/addon-onboarding",
		{
			name: '@storybook/addon-mcp',
			options: {
				toolsets: {},
			},
		},
		"storybook-addon-pseudo-states",
		'@storybook/addon-links',
	],
	"framework": "@storybook/nextjs-vite",
	"staticDirs": [
		"../public",
	],
};

export default config;
