import type { Metadata } from "next";

import 'leaflet/dist/leaflet.css';
import "./globals.scss";

import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
	title: "WiFi Free Map - 免費 WiFi 與充電設施地圖",
	description: "快速尋找附近的免費 WiFi 與公共充電設施",
};

/**
 * 根 Layout
 * Root Layout
 */
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
})
{
	return (
		<ClientLayout>{children}</ClientLayout>
	);
}
