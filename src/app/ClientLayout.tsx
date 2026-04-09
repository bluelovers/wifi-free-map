'use client';

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import Head from "next/head";

/**
 * 內部 Layout 元件 - 使用 antd ConfigProvider
 * Internal Layout component - uses antd ConfigProvider
 */
function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { antdTheme, isDark } = useTheme();

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