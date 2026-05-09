import { AliasToken, MapToken } from 'antd/es/theme/interface';
import { IThemeSet } from './ThemeProvider';
import { ThemeConfig } from 'antd';
import { ITSPickExtra } from 'ts-type';

const fontFamily = `"JetBrains Mono", "Noto Sans CJK JP", "Noto Sans CJK TC", "Noto Sans JP", "Noto Sans TC", sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`;

const sharedToken = {

	fontFamily,
	fontFamilyCode: fontFamily,

} satisfies Partial<AliasToken>;

export interface IThemeConfigSet extends ITSPickExtra<ThemeConfig, 'token'>
{

}

export const createThemeConfigSeedToken001 = (isDark: boolean) =>
{
	const seedToken = {
		...sharedToken,

		colorPrimary: '#cb2b83',
		borderRadius: 6,

		colorBgBase: isDark ? '#052335' : '#ffffff',
	} satisfies Partial<AliasToken>;

	return seedToken;
}

export const createThemeConfigSeedToken002 = (isDark: boolean) =>
{
	const seedToken = {
		...sharedToken,

		// 改用更清爽的青綠色或電氣藍
		colorPrimary: '#00d2ff',
		borderRadius: 8, // 稍微增加圓角提升現代感

		// 深色模式背景改為帶一點紫感的深灰藍，避免過於沉悶的純藍
		colorBgBase: isDark ? '#111a2d' : '#f0f2f5',

		// 關鍵：調整容器背景，增加層次
		colorBgContainer: isDark ? '#1a263e' : '#ffffff',

		// 讓文字顏色稍微帶點藍灰，減少純白的刺眼感
		colorTextBase: isDark ? '#e6efff' : '#000000',

		// 增加資訊反饋色
		colorSuccess: '#52c41a',
		colorWarning: '#faad14',
		colorError: '#ff4d4f',
		colorInfo: '#00d2ff',
	} satisfies Partial<AliasToken>;

	return {
		token: seedToken,
	} satisfies IThemeConfigSet;
}

export const createThemeConfigSeedToken003 = (isDark: boolean) =>
{
	const seedToken = {
		...sharedToken,

		colorPrimary: '#eb2f96',
		borderRadius: 10,

		// 深色模式改為「午夜紫」基底，與桃紅主色更搭
		colorBgBase: isDark ? '#1a0b2e' : '#ffffff',

		// 追加：影響側邊欄與選單的背景色
		colorBgLayout: isDark ? '#0f051a' : '#f5f5f5',

		// 控制元件表面的顏色
		colorBgElevated: isDark ? '#261245' : '#ffffff',

		// 活潑化建議：調整 Secondary 顏色
		colorTextSecondary: isDark ? '#b388ff' : '#8c8c8c',
	} satisfies Partial<AliasToken>;

	return {
		token: seedToken,
	} satisfies IThemeConfigSet;
}

export const createThemeConfigSeedToken004 = (isDark: boolean) =>
{
	const seedToken = {
		...sharedToken,

		// 主色：採用活潑的「寶石藍」
		colorPrimary: isDark ? '#ff2e88' : '#3a86ff',
		borderRadius: 10,

		/** 邊框寬度（預設 1） */
		lineWidth: 2,
		// lineType: 'dashed',

		// --- 基礎背景 (地圖與全域) ---
		colorBgBase: isDark ? '#1a1d23' : '#f0f2f5',

		// 側邊欄背景：亮色模式下改用飽和度略高的「教堂青灰色」，打破米色循環
		colorBgLayout: isDark ? '#0f172a' : '#5271ff22', // 帶透明感的青藍色底

		// 卡片背景：維持溫潤的暖白，確保與青色底有強烈對比
		colorBgContainer: isDark ? '#1e293b' : '#fffdf5',

		// --- 強化像素勾邊 (黑/深褐邊框) ---
		colorBorder: isDark ? '#2360b7' : '#2d2926',
		colorBorderSecondary: isDark ? '#3b74d0' : '#463f3a',

		colorTextBase: isDark ? '#e2e8f0' : '#2d2926',

		// @ts-ignore
		boxShadowCard: `1px 1px 4px #3b74d0`,

		// --- 狀態色 (高飽和遊戲風) ---
		colorSuccess: '#6fa832', // 蘋果綠
		colorWarning: '#f0a22a', // 橘黃
		colorError: '#e04343',   // 櫻桃紅
		colorInfo: '#2b66bc',    // 晴空藍

	} satisfies Partial<MapToken>;

	const components = {
		Card: {
			// 關鍵：亮色卡片不再用白/米色，改用「大理石冷灰藍」
			// 這樣在深色側邊欄上會非常亮眼，且色系完全不同
			// colorBgContainer: isDark ? '#374151' : '#eef2ff',
			// colorBorderSecondary: isDark ? '#4b5563' : '#2d2926', // 黑邊勾邊
			// boxShadow: isDark ? 'none' : '4px 4px 0px #c7d2fe', // 帶藍色的像素硬陰影

			/** 關鍵：暗色模式卡片使用「深紫藍色」，徹底擺脫灰色
			 * 亮色模式維持「大理石冷藍」撞色設計
			 */
			colorBgContainer: isDark ? '#1e1b4bae' : '#eef2ff',
			colorBorderSecondary: isDark ? '#5e5ae0' : '#2d2926',
			// 像素硬陰影：暗色用深靛藍，亮色用淺藍
			boxShadow: isDark ? '4px 4px 0px #0f172a' : '4px 4px 0px #c7d2fe',
		},
		Input: {
			// 搜尋框使用「薄荷螢光綠」，從藍色卡片中再次撞色跳出
			colorBgContainer: isDark ? '#111827' : '#e3f9f3',
			colorBorder: '#2d2926',
		},
		Select: {
			// 下拉選單改用「淡紫色系」背景
			colorBgContainer: isDark ? '#111827' : '#f5f3ff',
		},
		Button: {
			fontWeight: 800,
			colorBorder: '#2d2926',
			// 讓次要按鈕帶有「夕陽橘」的底色感
			colorFillSecondary: isDark ? '#374151' : '#fff7ed',
		},
		Collapse: {
			// 摺疊面板標題區改用「淺咖啡色系」
			headerBg: isDark ? '#1f2937' : '#faf7f0',
		},
		Tag: {
			// 標籤維持高飽和度多彩
			borderRadius: 5,
		},
	} satisfies Partial<ThemeConfig["components"]>;

	return {
		token: seedToken,
		components,
	} satisfies IThemeConfigSet;
}
