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
