/**
 * 設施項目卡片 Storybook Story
 * Facility item card Storybook story
 *
 * 註：已從 @storybook/addon-docs/blocks 遷移至 @storybook/nextjs-vite
 * Note: migrated from @storybook/addon-docs/blocks to @storybook/nextjs-vite
 */
// import type { Meta } from '@storybook/addon-docs/blocks';
// import type { StoryObj } from '@storybook/react';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FacilityItemCard } from './FacilityItemCard';
import type { IStationBase } from '@/types/station-base';
import { defaultIconCharging, defaultIconWifi } from './FacilityPointDataList';
import { EnumGoogleMapsMode, generateGoogleMapsUrl, openGoogleMaps } from '@/lib/utils/google-maps-url';
import { mockChargingStation, mockPosition, mockStation } from '../../../test/fixtures/stories/stories-data-mock';

/**
 * Story 屬性型別
 * Story props type
 *
 * 繼承 FacilityItemCard 的所有屬性，並加入 googleMapsMode 用於 Storybook 控制面板
 * Extends FacilityItemCard props with googleMapsMode for Storybook controls
 */
type IStoryProps = React.ComponentProps<typeof FacilityItemCard> & {
	googleMapsMode: EnumGoogleMapsMode;
};

/**
 * Meta 設定
 * Meta configuration
 *
 * Storybook 元件層級設定，包含元件名稱、控制項配置與自訂 render 函式
 * Storybook component-level configuration including title, control setup, and custom render
 */
const meta = {
	/**
	 * 設施項目卡片
	 * Facility item card
	 *
	 * 顯示單個設施的名稱、地址、座標與距離
	 * 從 FacilityPointDataList 切割出的獨立子組件，無 Leaflet 依賴
	 * Displays a single facility's name, address, coordinates, and distance
	 * Extracted from FacilityPointDataList; no Leaflet dependency
	 */
	title: 'Components/FacilityItemCard',
	component: FacilityItemCard,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		googleMapsMode: {
			control: 'select',
			options: Object.values(EnumGoogleMapsMode),
			description: '選擇 Google Maps 的開啟模式',
			table: {
				/** 選擇性：在 UI 中分類 / Optional: categorize in the UI */
				category: 'Map Settings',
			},
		},
	},
	args: {
		googleMapsMode: EnumGoogleMapsMode.WebCoordAddress,
		onOpenMap: fn(),
		onClick: fn(),
	},
	/**
	 * 自訂渲染：封裝 onOpenMap 以支援 googleMapsMode 控制
	 * Custom render: wraps onOpenMap to support googleMapsMode control
	 *
	 * 從 render 參數中解構 googleMapsMode，再傳入 handleOpenMap
	 * Destructures googleMapsMode from render args, then passes handleOpenMap
	 */
	render: (args) =>
	{
		const { googleMapsMode, ...componentProps } = args;

		/**
		 * 重新封裝 onOpenMap，使其能讀取到 googleMapsMode
		 * Re-wrap onOpenMap to make googleMapsMode accessible
		 */
		const handleOpenMap = (item: IStationBase, isNavigation?: boolean) =>
		{
			/** 來自 Storybook UI 的選擇 / Selected from the Storybook UI */
			const url = generateGoogleMapsUrl(item, {
				mode: googleMapsMode,
				isNavigation,
			});
			openGoogleMaps(url);
		};

		return <FacilityItemCard {...componentProps} onOpenMap={handleOpenMap} />;
	},
} satisfies Meta<IStoryProps>;

export default meta;

/**
 * Story 型別
 * Story type
 */
type IStory = StoryObj<typeof meta>;

/**
 * WiFi 熱點卡片（有位置與距離）
 * WiFi hotspot card (with position and distance)
 *
 * 顯示 WiFi 圖示、開啟地圖按鈕、名稱、地址、座標與距離
 * 使用者位置設於台北車站附近，因此會顯示 ∼0.4km 的距離
 * Shows WiFi icon, open-map button, name, address, coordinates, and distance
 * User position is set near Taipei Main Station, so distance ∼0.4km will display
 */
export const WifiWithDistance: IStory = {
	args: {
		item: mockStation,
		icon: defaultIconWifi,
		position: mockPosition,
	},
};

/**
 * 充電站卡片（無位置）
 * Charging station card (without position)
 *
 * 顯示閃電圖示、名稱、地址與座標，因未提供 position 所以不顯示距離
 * Shows lightning icon, name, address, and coordinates; no distance shown
 */
export const ChargingWithoutDistance: IStory = {
	args: {
		item: mockChargingStation,
		icon: defaultIconCharging,
	},
};

/**
 * 無圖示卡片
 * Card without icon
 *
 * 不傳入 icon prop，僅顯示名稱與座標資訊
 * No icon prop — only shows name and coordinate info
 */
export const WithoutIcon: IStory = {
	args: {
		item: mockStation,
	},
};
