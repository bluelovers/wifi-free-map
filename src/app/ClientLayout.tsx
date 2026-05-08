'use client';

import { useEffect } from 'react';
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, Layout } from "antd";
import { ThemeProvider, useTheme, useCurrentTheme } from "@/components/theme/ThemeProvider";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Head from "next/head";
import { applyTokensAsCssVars } from '@/lib/utils/style/doc-style';
import { EnumThemeClassName, EnumThemeDataAttr } from '@/lib/utils/style/css-const';

/**
 * 內部 Layout 元件 - 使用 antd ConfigProvider
 * Internal Layout component - uses antd ConfigProvider
 */
function InternalLayout({
	children,
}: {
	children: React.ReactNode;
})
{
	const { isDark, darkTheme, lightTheme, toggleTheme } = useTheme();
	const { config: themeConfig } = useCurrentTheme();

	/**
	 * 初始化時將兩套 token (dark / light) 注入到 DOM
	 * 之後只需透過 <html> 的 class 切換即可
	 * On init, inject both dark/light token sets into DOM.
	 * Switching is done via <html> class toggle only.
	 */
	useEffect(() =>
	{
		if (isDark)
		{
			applyTokensAsCssVars(darkTheme.tokens!, { isDark: true });
		}
		else
		{
			applyTokensAsCssVars(lightTheme.tokens!, { isDark: false });
		}
	}, [isDark]);

	console.log('InternalLayout Theme config:', themeConfig, isDark);

	return (
		<ConfigProvider theme={themeConfig!}>
			<html lang="zh-TW" data-theme={isDark ? EnumThemeDataAttr.DARK : EnumThemeDataAttr.LIGHT}
			      className={isDark ? EnumThemeClassName.DARK : EnumThemeClassName.LIGHT}>
			<Head>
				<link rel="manifest" href="/manifest.json" />
			</Head>
			<body>
			<Layout>
				<ConfigProvider theme={darkTheme.config}>

					{/* 主題切換按鈕 */}
					<div
						style={{
							position: "fixed",
							top: "0px",
							right: "16px",
							zIndex: 9999,
						}}
					>
						<ThemeToggle theme={{ isDark, toggleTheme }} />
					</div>

				</ConfigProvider>

				{children}
			</Layout>
			</body>
			</html>
		</ConfigProvider>
	);
}

/**
 * Client Layout - 包裝 ThemeProvider
 * Client Layout - wraps ThemeProvider
 */
export default function ClientLayout({
	children,
}: {
	children: React.ReactNode;
})
{
	return (
		<AntdRegistry>
			<ThemeProvider>
				<InternalLayout>{children}</InternalLayout>
			</ThemeProvider>
		</AntdRegistry>
	);
}
