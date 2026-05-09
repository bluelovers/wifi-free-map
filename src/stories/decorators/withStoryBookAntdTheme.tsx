/**
 * antd 主題裝飾器
 * antd theme decorator
 *
 * 遵循 ClientLayout.tsx 的架構：AntdRegistry → ThemeProvider → ConfigProvider
 * 用於 Storybook stories 中展示受主題控制的 antd 元件
 * Follows ClientLayout.tsx architecture: AntdRegistry → ThemeProvider → ConfigProvider
 * Used in Storybook stories to display theme-controlled antd components
 */
import React from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { ThemeConfigProvider, ThemeRegistryRoot } from '@/components/layout/theme-layout';
import { antdTokenToCSSVar, useAsCssVarForStyle } from '@/lib/utils/style/antd-css-var-utils';
import { GlobalTypes } from 'storybook/internal/types';
import { useMemo } from 'storybook/internal/preview-api';
import { themes } from 'storybook/theming';
import { addons } from 'storybook/preview-api';

import { useStorybookApi } from 'storybook/manager-api';

/**
 * Storybook antd 主題列舉
 * Storybook antd theme enumeration
 *
 * 包含一般主題與透明背景變體，用於 Storybook toolbar 主題切換
 * Includes standard themes and transparent background variants for Storybook toolbar theme switching
 */
export const enum EnumStoryBookAntdTheme
{
	/** 淺色主題（灰底）/ Light theme (grey background) */
	Light = 'light',
	/** 深色主題（黑底）/ Dark theme (dark background) */
	Dark = 'dark',
	/** 空主題（白底，無自訂 token）/ Empty theme (white background, no custom tokens) */
	Empty = 'empty',

	/** 淺色主題（透明背景）/ Light theme (transparent background) */
	LightTransparent = 'light_transparent',
	/** 深色主題（透明背景）/ Dark theme (transparent background) */
	DarkTransparent = 'dark_transparent',
	/** 空主題（透明背景）/ Empty theme (transparent background) */
	EmptyTransparent = 'empty_transparent',
}

export const globalTypesStoryBookAntdTheme = {
	theme: {
		name: 'Theme',
		description: '切換 antd 主題 / Switch antd theme',
		defaultValue: EnumStoryBookAntdTheme.Dark,
		toolbar: {
			icon: 'paintbrush',
			dynamicTitle: true,
			items: [
				{ value: EnumStoryBookAntdTheme.Dark, title: 'Dark', icon: 'circlehollow' },
				{ value: EnumStoryBookAntdTheme.Light, title: 'Light', icon: 'circle' },
				{ value: EnumStoryBookAntdTheme.Empty, title: 'Empty', icon: 'circle' },

				{ value: EnumStoryBookAntdTheme.DarkTransparent, title: 'Dark Transparent', icon: 'circle' },
				{ value: EnumStoryBookAntdTheme.LightTransparent, title: 'Light Transparent', icon: 'circle' },
				{ value: EnumStoryBookAntdTheme.EmptyTransparent, title: 'Empty Transparent', icon: 'circle' },
			],
		},
	},
} satisfies GlobalTypes

/**
 * 解析主題選項並回傳對應的 isDark 與背景色
 * Parse theme option and return corresponding isDark and background color
 *
 * @param globalsTheme - Storybook toolbar 選擇的主題 / Theme selected from Storybook toolbar
 * @returns 解析後的 isDark 與 backgroundColor / Parsed isDark and backgroundColor
 */
function _handleThemeOption(globalsTheme?: EnumStoryBookAntdTheme)
{
	const ret = {
		/** 是否為深色模式 / Whether dark mode */
		isDark: void 0 as any as boolean,
		/** 背景色 / Background color */
		backgroundColor: void 0 as any as string,
	};

	/**
	 * 透明背景變體（_transparent 後綴）使用 transparent 背景
	 * Transparent variants (with _transparent suffix) use transparent background
	 */
	if (globalsTheme?.includes('_transparent'))
	{
		ret.backgroundColor = 'transparent';
	}
	else
	{
		// ret.backgroundColor = useAsCssVarForStyle(antdTokenToCSSVar('colorBgContainer'))
	}

	/**
	 * 根據主題類型設定 isDark
	 * Set isDark based on theme type
	 */
	switch (globalsTheme)
	{
		case EnumStoryBookAntdTheme.Light:
		case EnumStoryBookAntdTheme.LightTransparent:
			ret.isDark = false;
			break;
		case EnumStoryBookAntdTheme.Empty:
		case EnumStoryBookAntdTheme.EmptyTransparent:
			/** 空主題：保留 undefined，讓 ThemeConfigProvider 使用預設值 / Empty: keep undefined, let ThemeConfigProvider use default */
			break;
		case EnumStoryBookAntdTheme.Dark:
		case EnumStoryBookAntdTheme.DarkTransparent:
		default:
			/** 預設為深色模式 / Default to dark mode */
			ret.isDark = true;
	}

	return ret;
}

/**
 * 全域主題裝飾器（根據 toolbar 切換）
 * Global theme decorator (switches based on toolbar selection)
 *
 * 遵循 ClientLayout.tsx 的完整架構：
 * AntdRegistry → ThemeProvider → ConfigProvider
 * 同時支援 Storybook toolbar 即時切換 Light / Dark / Empty 主題
 *
 * Follows ClientLayout.tsx full architecture:
 * AntdRegistry → ThemeProvider → ConfigProvider
 * Also supports instant theme switching via Storybook toolbar
 */
/**
 * 全域 antd 主題裝飾器
 * Global antd theme decorator
 *
 * 根據 Storybook toolbar 選擇的主題即時切換 Light / Dark / Empty 及其透明變體
 * 遵循專案架構：ThemeRegistryRoot → ThemeConfigProvider → Layout
 * Dynamically switches Light / Dark / Empty themes (and their transparent variants)
 * based on Storybook toolbar selection.
 * Follows project architecture: ThemeRegistryRoot → ThemeConfigProvider → Layout
 */
export const withStoryBookAntdTheme = (Story: React.FC, context: {
	globals?: {
		theme?: EnumStoryBookAntdTheme;
	};
}) =>
{
	/**
	 * 快取主題選項以避免不必要的重新渲染
	 * Cache theme options to avoid unnecessary re-renders
	 */
	const globalsTheme = useMemo(() =>
	{
		const globalsTheme = _handleThemeOption(context.globals?.theme);

		return globalsTheme;
	}, [context.globals?.theme]);

	return (
		<div
			style={{
				/** 除錯邊框：辨識 decorator 邊界 / Debug border: identify decorator boundary */
				border: '2px solid #52c41a',
			}}
		>
			{/**
			 * 根層級註冊：AntdRegistry + ThemeProvider
			 * Root registry: AntdRegistry + ThemeProvider
			 */}
			<ThemeRegistryRoot>
				{/**
				 * 主題 ConfigProvider：注入 isDark 或自訂 theme
				 * Theme ConfigProvider: inject isDark or custom theme
				 */}
				<ThemeConfigProvider isDark={globalsTheme.isDark}>
					{/**
					 * Layout 容器：設定背景色與內距
					 * Layout container: set background color and padding
					 */}
					<Layout
						style={{
							backgroundColor: globalsTheme.backgroundColor,
							padding: 32,
							minHeight: 100,
							minWidth: 150,
						}}
					>
						<Story />
					</Layout>
				</ThemeConfigProvider>
			</ThemeRegistryRoot>
		</div>
	);
};
