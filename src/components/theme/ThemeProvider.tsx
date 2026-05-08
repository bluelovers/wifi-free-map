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

import { EnumThemeDataAttr } from '@/lib/utils/style/css-const';
import { ITSPickExtra } from 'ts-type';
import { createThemeConfigSeedToken002, createThemeConfigSeedToken003, createThemeConfigSeedToken004 } from './theme-set';

const { getDesignToken, useToken } = theme;

/**
 * antd Design Tokens 類型
 * 映射 antd tokens 到自訂 SCSS 變數名稱
 */
interface IAntdTokens extends ITSPickExtra<AliasToken, 'fontFamily' | 'fontFamilyCode'>
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
 * 一組完整的主題資料
 * A complete set of theme data
 */
export interface IThemeSet
{
	/** ThemeConfig（含 seed token，可直接傳給 ConfigProvider）*/
	config: ThemeConfig;
	/** IAntdTokens（簡化版，用於 CSS 注入）*/
	tokens: IAntdTokens;
	/** AliasToken（完整版 antd Design Token）*/
	globalToken: AliasToken;
}

/**
 * 主題 Context 類型
 * Theme Context type
 */
export interface IThemeContext
{
	/** 是否為深色模式 */
	isDark: boolean;
	/** 切換主題 */
	toggleTheme: () => void;

	/** 暗色主題完整資料 / Dark theme full data set */
	darkTheme: IThemeSet;
	/** 亮色主題完整資料 / Light theme full data set */
	lightTheme: IThemeSet;
}

/**
 * 將 antd DesignToken 轉換為 CSS 變數物件
 * Convert antd DesignToken to CSS variables object
 *
 * 映射 antd token 名稱到自訂 SCSS 變數名稱
 */
const tokensToCssVars = (token: AliasToken): IAntdTokens => ({
	// ...token,

	// 主色調
	colorPrimary: token.colorPrimary,
	colorPrimaryHover: token.colorPrimaryHover || token.colorPrimary,
	colorPrimaryActive: token.colorPrimaryActive || token.colorPrimary,

	fontFamily: token.fontFamily,
	fontFamilyCode: token.fontFamilyCode,

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
export const createThemeConfig = (isDark: boolean): IThemeSet =>
{
	/**
	 * 使用 antd 預設算法 - 自動計算所有顏色
	 */
	const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

	/**
	 * 只設定需要的 seed token - 其餘顏色由 algorithm 計算並自動填充
	 */
	const themeConfigSet = createThemeConfigSeedToken004(isDark);

	const config: ThemeConfig = {
		token: themeConfigSet.token,
		components: themeConfigSet.components,
		algorithm: [
			algorithm,
			// theme.compactAlgorithm,
		],
		hashed: false,
	};

	/**
	 * 應用 algorithm 處理顏色 - 自動生成所有 Design Token
	 * const processedToken = algorithm(seedToken);
	 */
	const globalToken = getDesignToken(config);

	const tokens = tokensToCssVars(globalToken);

	return {
		config,
		tokens,
		globalToken,
	};
};

/**
 * 純函數：根據 isDark 從兩套 IThemeSet 中選取對應的主題資料
 * Pure function: Select the active theme set from dark/light based on isDark
 *
 * 可在 Provider 內部直接使用（不依賴 React hooks）
 * Can be used inside Provider directly (no React hooks dependency)
 */
function _selectThemeSet(isDark: boolean, sets: Pick<IThemeContext, 'darkTheme' | 'lightTheme'>): IThemeSet
{
	return isDark ? sets.darkTheme : sets.lightTheme;
}

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

	/**
	 * 兩套完整主題資料集（dark + light），初始化時一次產生
	 * Both complete theme data sets (dark + light), generated once on init
	 */
	const [darkTheme, setDarkTheme] = useState<IThemeSet>(() => createThemeConfig(true));
	const [lightTheme, setLightTheme] = useState<IThemeSet>(() => createThemeConfig(false));

	/**
	 * @title 主題配置更新（開發期間使用）
	 * @description 根據 isDark 狀態更新主題配置
	 */
	(typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') && useEffect(() =>
	{

		setDarkTheme(() => createThemeConfig(true));
		setLightTheme(() => createThemeConfig(false));

	}, [isDark]);

	/**
	 * @title 主題同步監聽器
	 * @description 合併初始化與系統主題監聽，確保 UI 狀態與使用者偏好/系統環境同步。
	 *
	 * ### 合併優化重點：
	 * 1. **資源共享**：共用同一個 `mediaQuery` 實例，減少系統調用。
	 * 2. **單一真值來源**：統一在一個 Effect 內維護 `isDark` 的判斷邏輯，避免分散在多個生命週期中。
	 * 3. **清理機制**：確保組件卸載時，監聽器能被正確移除，防止記憶體洩漏。
	 */
	useEffect(() =>
	{
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		/** 根據優先順序計算當前應有的主題狀態 */
		const getInitialThemeIsDark = () =>
		{
			const stored = localStorage.getItem('theme');
			if (stored === EnumThemeDataAttr.DARK) return true;
			if (stored === EnumThemeDataAttr.LIGHT) return false;
			/** 若無快取，則追隨系統 */
			return mediaQuery.matches;
		};

		/** 執行初始化 */
		const initialDark = getInitialThemeIsDark();
		setIsDark(initialDark);

		console.log('Theme initialized:', {
			isDark: initialDark,
			source: localStorage.getItem('theme') || EnumThemeDataAttr.SYSTEM,
		});

		/** 定義系統變化時的處理函式 */
		const handleChange = (e: MediaQueryListEvent) =>
		{
			const stored = localStorage.getItem('theme');
			/** 只有在使用者沒有手動指定（無快取）的情況下，才追隨系統變化 */
			if (!stored)
			{
				const newDark = e.matches;
				setIsDark(newDark);
				console.log('System theme auto-updated:', newDark);
			}
		};

		/** 綁定監聽器 */
		mediaQuery.addEventListener('change', handleChange);

		/** 清理監聽器 */
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	/** 切換主題 */
	const toggleTheme = () =>
	{
		const newTheme = !isDark;
		setIsDark(newTheme);
		localStorage.setItem('theme', newTheme ? EnumThemeDataAttr.DARK : EnumThemeDataAttr.LIGHT);

		console.log('Theme toggled:', newTheme);
	};

	return (
		<ThemeContext.Provider value={{ isDark, toggleTheme, darkTheme, lightTheme }}>
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

/**
 * 依照主題（isDark）回傳對應的完整 config、tokens、globalToken
 * Returns config, tokens, and globalToken for the specified or current theme
 *
 * 底層使用 _selectThemeSet 純函數，切換主題時不需要重新計算
 * Uses _selectThemeSet under the hood; switching requires no recomputation
 *
 * @param forcedIsDark - 指定要取得的主题（不傳則使用目前的 isDark）/ Force a specific theme (defaults to current isDark)
 * @returns 指定主題的完整資料 / Specified theme's full data
 * - config: ThemeConfig（含 seed token，可直接傳給 ConfigProvider）
 * - tokens: IAntdTokens（簡化版，用於 CSS 注入）
 * - globalToken: AliasToken（完整版 antd Design Token）
 *
 * @example
 * ```typescript
 * // 使用目前主題
 * const { config, tokens, globalToken } = useCurrentTheme();
 *
 * // 指定主題（無論目前是 dark 還是 light 都可取得指定主題的資料）
 * const darkTheme = useCurrentTheme(true);
 * const lightTheme = useCurrentTheme(false);
 *
 * // config 可用於 ConfigProvider
 * <ConfigProvider theme={config}>...</ConfigProvider>
 *
 * // globalToken 可引用完整的 antd Design Token
 * console.log(globalToken.boxShadow);
 * console.log(globalToken.fontSizeLG);
 * ```
 */
export function useCurrentTheme(forcedIsDark?: boolean): IThemeSet
{
	const { isDark, darkTheme, lightTheme } = useTheme();

	return _selectThemeSet(forcedIsDark ?? isDark, { darkTheme, lightTheme });
}
