'use client';

import { useEffect } from 'react';
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import Head from "next/head";

/**
 * 將 antd tokens 轉換為 CSS 變數字串
 * Convert antd tokens to CSS variables string
 */
const tokensToCssVariables = (tokens: any): string => {
    const cssVars = Object.entries(tokens)
        .map(([key, value]) => {
            // 將駝峰式轉換為連字符式 (camelCase -> kebab-case)
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `--${cssKey}: ${value};`;
        })
        .join(' ');
    return cssVars;
};

/**
 * 內部 Layout 元件 - 使用 antd ConfigProvider
 * Internal Layout component - uses antd ConfigProvider
 */
function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { antdTheme, isDark, antdTokens } = useTheme();

  // 將 antd tokens 應用為 CSS 變數
  useEffect(() => {
    const cssVars = tokensToCssVariables(antdTokens);
    document.documentElement.setAttribute('style', cssVars);
  }, [antdTokens]);

  return (
    <ConfigProvider theme={antdTheme}>
      <html lang="zh-TW" data-theme={isDark ? "dark" : "light"}>
        <Head>
          <link rel="manifest" href="/manifest.json" />
        </Head>
        <body>
          <AntdRegistry>
            {/* 主題切換按鈕 */}
            <div
              style={{
                position: "fixed",
                top: "16px",
                right: "16px",
                zIndex: 9999,
              }}
            >
              <ThemeToggle />
            </div>
            {children}
          </AntdRegistry>
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
}) {
  return (
    <ThemeProvider>
      <InternalLayout>{children}</InternalLayout>
    </ThemeProvider>
  );
}