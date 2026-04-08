import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";

export const metadata: Metadata = {
  title: "WiFi Free Map - 免費 WiFi 與充電設施地圖",
  description: "快速尋找附近的免費 WiFi 與公共充電設施",
};

import Head from "next/head";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <Head>
          <link rel="manifest" href="/manifest.json" />
        </Head>
        <body>
          <AntdRegistry>
            {children}
          </AntdRegistry>
        </body>
    </html>
  );
}
