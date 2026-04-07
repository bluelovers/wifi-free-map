import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WiFi Free Map - 免費 WiFi 與充電設施地圖",
  description: "快速尋找附近的免費 WiFi 與公共充電設施",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
