'use client';

import { useEffect } from 'react';
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { createThemeConfig, ThemeProvider, useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import Head from "next/head";

/**
 * 將 antd tokens 應用為 CSS 變數
 * Apply antd tokens as CSS variables
 * 
 * 使用 style.setProperty 單獨設定每個變數，避免覆蓋其他 style 屬性
 */
const applyTokensAsCssVars = (tokens: any): void => {
    if (!tokens) return;
    
    const root = document.documentElement;
    Object.entries(tokens).forEach(([key, value]) => {
        // 將駝峰式轉換為連字符式 (camelCase -> kebab-case)
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(`--${cssKey}`, String(value));
    });
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
    if (antdTokens) {
      applyTokensAsCssVars(antdTokens);
    }
  }, [antdTokens]);

  // 防止 antdTheme 為空
  const themeConfig = antdTheme?.token?.colorPrimary && antdTheme || createThemeConfig(isDark).config;

  console.log('InternalLayout Theme config:', themeConfig, isDark);

  return (
    <ConfigProvider theme={themeConfig}>
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