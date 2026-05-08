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
import { ConfigProvider, theme } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { createThemeConfigSeedToken004 } from '@/components/theme/theme-set';

/** 淺色模式背景色 / Light mode background color */
export const LIGHT_BG = '#f0f2f5';
/** 深色模式背景色 / Dark mode background color */
export const DARK_BG = '#1a1d23';

/**
 * 建立 antd 主題配置
 * Create antd theme configuration
 *
 * 使用專案目前的 Seed Token 004（遊戲風寶石藍主題）
 * Uses the project's current Seed Token 004 (game-style gem-blue theme)
 */
export function createAntdTheme(isDark: boolean)
{
	const themeSet = createThemeConfigSeedToken004(isDark);

	return {
		token: themeSet.token,
		components: themeSet.components,
		algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
		hashed: false,
	};
}

/**
 * 淺色主題包裝元件
 * Light theme wrapper component
 */
export function LightThemeWrapper({ children }: { children: React.ReactNode })
{
	return (
		<AntdRegistry>
			<ConfigProvider theme={createAntdTheme(false)}>
				<div style={{
					padding: 32,
					background: LIGHT_BG,
					minHeight: '100vh',
				}}>
					{children}
				</div>
			</ConfigProvider>
		</AntdRegistry>
	);
}

/**
 * 深色主題包裝元件
 * Dark theme wrapper component
 */
export function DarkThemeWrapper({ children }: { children: React.ReactNode })
{
	return (
		<AntdRegistry>
			<ConfigProvider theme={createAntdTheme(true)}>
				<div style={{
					padding: 32,
					background: DARK_BG,
					minHeight: '100vh',
				}}>
					{children}
				</div>
			</ConfigProvider>
		</AntdRegistry>
	);
}

/**
 * 淺色主題裝飾器（Storybook decorator）
 * Light theme decorator (Storybook decorator)
 */
export const withLightTheme = (Story: React.FC) => (
	<LightThemeWrapper>
		<Story />
	</LightThemeWrapper>
);

/**
 * 深色主題裝飾器（Storybook decorator）
 * Dark theme decorator (Storybook decorator)
 */
export const withDarkTheme = (Story: React.FC) => (
	<DarkThemeWrapper>
		<Story />
	</DarkThemeWrapper>
);

/** 空主題背景色 / Empty theme background color */
export const EMPTY_BG = '#ffffff';

/**
 * 空主題包裝元件
 * Empty theme wrapper component
 *
 * 套用 ConfigProvider，但只設定 algorithm 與 hashed，不帶任何自訂 token/components
 * 與 Light/Dark 主題使用相同結構，但完全使用 antd 預設 seed token
 * 作為比對基準線：展示「沒有專案自訂主題時的 antd 原廠樣式」
 *
 * Uses ConfigProvider with algorithm + hashed only — NO custom token/components.
 * Same wrapper structure as Light/Dark, but with pure antd default seed tokens.
 * Serves as baseline: "what antd looks like without any project custom theme"
 */
export function EmptyThemeWrapper({ children }: { children: React.ReactNode })
{
	return (
		<AntdRegistry>
			<ConfigProvider theme={{
				algorithm: theme.defaultAlgorithm,
				hashed: false,
			}}>
				<div style={{
					padding: 32,
					background: EMPTY_BG,
					minHeight: '100vh',
				}}>
					{children}
				</div>
			</ConfigProvider>
		</AntdRegistry>
	);
}

/**
 * 空主題裝飾器（Storybook decorator）
 * Empty theme decorator (Storybook decorator)
 *
 * 套用 ConfigProvider，無自訂 token/components
 * 作為比對 Light/Dark 自訂主題的基準線
 *
 * ConfigProvider without custom token/components.
 * Baseline for comparing against Light/Dark custom themes.
 */
export const withEmptyTheme = (Story: React.FC) => (
	<EmptyThemeWrapper>
		<Story />
	</EmptyThemeWrapper>
);

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
export const withTheme = (Story: React.FC, context: { globals?: { theme?: string } }) =>
{
	const globalsTheme = context.globals?.theme || 'light';
	const isDark = globalsTheme === 'dark';
	const isEmpty = globalsTheme === 'empty';

	const themeConfig = isEmpty
		? { algorithm: theme.defaultAlgorithm, hashed: false }
		: createAntdTheme(isDark);

	const bg = isEmpty ? EMPTY_BG : (isDark ? DARK_BG : LIGHT_BG);

	return (
		<AntdRegistry>
			<ThemeProvider>
				<ConfigProvider theme={themeConfig}>
					<div style={{
						padding: 32,
						background: bg,
						minHeight: '100vh',
					}}>
						<Story />
					</div>
				</ConfigProvider>
			</ThemeProvider>
		</AntdRegistry>
	);
};
