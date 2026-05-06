/**
 * 主題 Context Provider
 * Theme Context Provider
 *
 * 使用 antd ConfigProvider 內建的主題切換功能
 * 所有顏色統一來自 antd Design Tokens
 *
 * 參考：https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8-design-token
 */
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeConfig, theme } from 'antd';
import { AliasToken } from 'antd/es/theme/interface';

const { getDesignToken, useToken } = theme;

/**
 * antd Design Tokens 類型
 * 映射 antd tokens 到自訂 SCSS 變數名稱
 */
interface IAntdTokens
{
	// 主色調
	colorPrimary: string;
	colorPrimaryHover: string;
	colorPrimaryActive: string;

	// 輔助色
	colorSuccess: string;
	colorWarning: string;
	colorError: string;
	colorInfo: string;

	// 背景色 (映射到 SCSS 的 --bg-* 名稱)
	bgPrimary: string;
	bgSecondary: string;
	bgElevated: string;
	bgContainer: string;

	// 文字色 (映射到 SCSS 的 --text-* 名稱)
	textPrimary: string;
	textSecondary: string;
	textDisabled: string;

	// 邊框色 (映射到 SCSS 的 --border-* 名稱)
	borderColor: string;
	borderColorHover: string;

	// 陰影
	boxShadow: string;

	// 圓角
	borderRadius: number;
}

/**
 * 主題 Context 類型
 * Theme Context type
 */
interface IThemeContext
{
	/** 是否為深色模式 */
	isDark: boolean;
	/** 切換主題 */
	toggleTheme: () => void;
	/** antd 主題配置 */
	antdTheme: ThemeConfig;
	/** antd Design Tokens (用於 CSS 變數) */
	antdTokens: IAntdTokens | null;
}

/**
 * 將 antd DesignToken 轉換為 CSS 變數物件
 * Convert antd DesignToken to CSS variables object
 *
 * 映射 antd token 名稱到自訂 SCSS 變數名稱
 */
const tokensToCssVars = (token: AliasToken): IAntdTokens => ({
	// 主色調
	colorPrimary: token.colorPrimary,
	colorPrimaryHover: token.colorPrimaryHover || token.colorPrimary,
	colorPrimaryActive: token.colorPrimaryActive || token.colorPrimary,

	// 輔助色
	colorSuccess: token.colorSuccess,
	colorWarning: token.colorWarning,
	colorError: token.colorError,
	colorInfo: token.colorInfo,

	// 背景色 - 映射到 SCSS 的 --bg-* 名稱
	bgPrimary: token.colorBgLayout,
	bgSecondary: token.colorBgSpotlight,
	bgElevated: token.colorBgElevated,
	bgContainer: token.colorBgContainer,

	// 文字色 - 映射到 SCSS 的 --text-* 名稱
	textPrimary: token.colorText,
	textSecondary: token.colorTextSecondary,
	textDisabled: token.colorTextDisabled,

	// 邊框色 - 映射到 SCSS 的 --border-* 名稱
	borderColor: token.colorBorder,
	borderColorHover: token.colorPrimary,

	// 陰影
	boxShadow: token.boxShadow,

	// 圓角
	borderRadius: token.borderRadius,
});

/**
 * 建立 antd 主題配置
 * Create antd theme configuration
 *
 * 只提供 colorPrimary 作為 seed token
 * 其他顏色由 antd algorithm 自動計算
 */
export const createThemeConfig = (isDark: boolean): { config: ThemeConfig; tokens: IAntdTokens } =>
{
	// 使用 antd 預設算法 - 自動計算所有顏色
	const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

	// 只設定需要的 seed token - 其餘顏色由 algorithm 計算
	// 使用 any 繞過 TypeScript 嚴格檢查，algorithm 會自動填充其餘屬性
	const seedToken: Partial<AliasToken> = {
		colorPrimary: '#1890ff',
		borderRadius: 6,
		colorBgBase: isDark ? '#052335' : '#ffffff',
		fontFamily: '"JetBrains Mono", "Noto Sans CJK JP", "Noto Sans CJK TC", "Noto Sans JP", "Noto Sans TC", sans-serif',
		fontFamilyCode: '"JetBrains Mono", "Noto Sans CJK JP", "Noto Sans CJK TC", "Noto Sans JP", "Noto Sans TC", sans-serif',
	};

	const config: ThemeConfig = {
		token: seedToken,
		algorithm: [
			algorithm,
			// theme.compactAlgorithm,
		],
	};

	// 應用 algorithm 處理顏色 - 自動生成所有 Design Token
	// const processedToken = algorithm(seedToken);
	const globalToken = getDesignToken(config);

	const tokens = tokensToCssVars(globalToken);

	// console.dir(JSON.stringify({
	//     isDark,
	//     processedToken,
	//     tokens,
	//     globalToken,
	// }), { depth: null });

	// console.dir(JSON.stringify({
	//     isDark,
	//     processedToken,
	// }), { depth: null });

	//  console.dir(JSON.stringify({
	//     isDark,
	//     tokens,
	// }), { depth: null });

	//  console.dir(JSON.stringify({
	//     isDark,
	//     globalToken,
	// }), { depth: null });

	return {
		config,
		tokens,
	};
};

// 建立 Context
const ThemeContext = createContext<IThemeContext | undefined>(undefined);

/**
 * 主題 Provider 元件
 * Theme Provider component
 *
 * 所有顏色統一來自 antd Design Tokens
 */
export function ThemeProvider({ children }: { children: ReactNode })
{
	const [isDark, setIsDark] = useState(false);

	// 使用空物件作為初始值 - 由 antd algorithm 計算後填充
	const [antdTheme, setAntdTheme] = useState<ThemeConfig>({
		token: {},
		algorithm: theme.defaultAlgorithm,
	});
	const [antdTokens, setAntdTokens] = useState<IAntdTokens | null>(null);

	// 初始化主題配置
	useEffect(() =>
	{
		const stored = localStorage.getItem('theme');
		let initialDark = false;

		if (stored === 'dark')
		{
			initialDark = true;
		}
		else if (stored === 'light')
		{
			initialDark = false;
		}
		else
		{
			initialDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}

		setIsDark(initialDark);
		const { config, tokens } = createThemeConfig(initialDark);
		setAntdTheme(config);
		setAntdTokens(tokens);

		console.log('Initial theme config:', config, initialDark);
	}, []);

	// 監聽系統主題變化
	useEffect(() =>
	{
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) =>
		{
			const stored = localStorage.getItem('theme');
			if (!stored)
			{
				const newDark = e.matches;
				setIsDark(newDark);
				const { config, tokens } = createThemeConfig(newDark);
				setAntdTheme(config);
				setAntdTokens(tokens);

				console.log('System theme changed:', config, newDark);
			}
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	/** 切換主題 */
	const toggleTheme = () =>
	{
		const newTheme = !isDark;
		setIsDark(newTheme);
		localStorage.setItem('theme', newTheme ? 'dark' : 'light');

		const { config, tokens } = createThemeConfig(newTheme);
		setAntdTheme(config);
		setAntdTokens(tokens);

		console.log('Theme toggled:', config, newTheme);
	};

	return (
		<ThemeContext.Provider value={{ isDark, toggleTheme, antdTheme, antdTokens }}>
			{children}
		</ThemeContext.Provider>
	);
}

/**
 * 使用主題的 hook
 * Hook to use theme
 */
export function useTheme()
{
	const context = useContext(ThemeContext);
	if (!context)
	{
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
