'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { IThemeContext, ThemeProvider, useCurrentTheme, useTheme } from '../theme/ThemeProvider';
import { ConfigProvider, ConfigProviderProps } from 'antd';
import { ITSRequireAtLeastOne } from 'ts-type';
import { ReactNode, useEffect, useMemo } from 'react';
import { applyTokensAsCssVars } from '@/lib/utils/style/doc-style';

/**
 * 主題註冊根層級元件
 * Theme registry root component
 *
 * 確保只使用一次，位於元件樹最外層
 * 包裝 AntdRegistry 與 ThemeProvider，提供 antd CSS-in-JS 與主題上下文
 * Make sure only use this once, positioned at the outermost layer.
 * Wraps AntdRegistry and ThemeProvider to provide antd CSS-in-JS and theme context.
 *
 * @param children - 子元件 / Child components
 */
export function ThemeRegistryRoot({
	children,
}: {
	/** 子元件 / Child components */
	children: ReactNode;
})
{
	return (
		<AntdRegistry>
			<ThemeProvider>
				{children}
			</ThemeProvider>
		</AntdRegistry>
	)
}

/**
 * 主題 ConfigProvider 參數介面
 * Theme ConfigProvider props interface
 *
 * 支援傳入自訂 theme 或 isDark 旗標（二選一），可選擇性地將 token 注入 DOM
 * Supports either a custom theme object or an isDark flag (at least one required).
 * Optionally injects tokens into the DOM root.
 */
export type IThemeConfigProviderProps = Omit<ConfigProviderProps, 'theme' | 'children'> & ITSRequireAtLeastOne<{
	/** 自訂 antd 主題配置（可選，與 isDark 二選一）/ Custom antd theme config (optional, mutually exclusive with isDark) */
	theme?: ConfigProviderProps['theme'] | null;
	/** 是否使用深色主題（可選，與 theme 二選一）/ Whether to use dark theme (optional, mutually exclusive with theme) */
	isDark?: IThemeContext['isDark'] | null;
}> & {
	/** 子元件 / Child components */
	children: ReactNode;
	/** 是否將 token 作為 CSS 變數注入到根元素 / Whether to inject tokens as CSS variables into the root element */
	applyTokensOnRoot?: boolean;
};

/**
 * 主題 ConfigProvider 元件
 * Theme ConfigProvider component
 *
 * 根據 theme 或 isDark 參數建立對應的 antd ConfigProvider
 * 可選擇性地將 token 注入到 DOM 根元素
 * Creates an antd ConfigProvider based on either a theme object or isDark flag.
 * Optionally injects tokens into the DOM root element.
 *
 * @param props.theme - 自訂主題配置（優先度高於 isDark）/ Custom theme config (higher priority than isDark)
 * @param props.isDark - 是否深色模式 / Whether dark mode
 * @param props.applyTokensOnRoot - 是否將 token 注入根元素 / Whether to inject tokens into root
 * @param props - 其餘 ConfigProviderProps / Other ConfigProviderProps
 */
export function ThemeConfigProvider({
	theme,
	isDark,

	applyTokensOnRoot,

	...props
}: IThemeConfigProviderProps)
{
	/**
	 * 決定初始主題配置
	 * Determine initial theme configuration
	 *
	 * 優先使用傳入的 theme；若無則透過 useCurrentTheme 根據 isDark 取得對應主題
	 * Priority: explicit theme > useCurrentTheme(isDark) > undefined
	 */
	const initTheme = useMemo(() =>
	{

		if (typeof theme !== 'undefined')
		{
			return theme;
		}
		else if (typeof isDark === 'boolean' || isDark === null)
		{
			return useCurrentTheme(isDark!).config;
		}
	}, [theme, isDark]);

	/**
	 * 若啟用 applyTokensOnRoot，在初始化時將 token 以 CSS 變數形式注入 DOM
	 * If applyTokensOnRoot is enabled, inject tokens as CSS variables into the DOM on init.
	 * 後續只需透過 <html> class 切換即可變更主題，無需重新注入
	 * Subsequent theme switching only requires <html> class toggling — no re-injection needed.
	 */
	if (applyTokensOnRoot)
	{
		const { isDark, darkTheme, lightTheme } = useTheme();

		useEffect(() =>
		{
			if (isDark === true)
			{
				applyTokensAsCssVars(darkTheme.tokens!, { isDark });
			}
			else if (isDark === false)
			{
				applyTokensAsCssVars(lightTheme.tokens!, { isDark });
			}
		}, [isDark]);
	}

	return (
		<ConfigProvider theme={initTheme!} {...props} />
	)
}
