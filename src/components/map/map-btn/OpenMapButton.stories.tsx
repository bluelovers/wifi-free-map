/**
 * 開啟地圖/導航按鈕 Storybook Story
 * Open map/navigation button Storybook story
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { OpenMapButton } from './OpenMapButton';
import { mockStation } from '../../../../test/fixtures/stories/stories-data-mock';

const meta = {
	/**
	 * 開啟地圖/導航按鈕
	 * Open map/navigation button
	 *
	 * 顯示「地圖」與「導航」兩個按鈕
	 * 點擊時回呼 onOpenMap(item, isNavigation)，可在故事中透過 Actions panel 觀察
	 * Displays "Map" and "Navigate" buttons; onClick fires onOpenMap(item, isNavigation)
	 */
	title: 'Components/OpenMapButton',
	component: OpenMapButton,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	args: {
		item: mockStation,
		onOpenMap: fn(),
	},
} satisfies Meta<typeof OpenMapButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 預設狀態
 * Default state
 *
 * 顯示「地圖」與「導航」兩個按鈕，點擊可在 Actions panel 查看事件
 * Shows "Map" and "Navigate" buttons; click to inspect events in Actions panel
 */
export const Default: Story = {};

/**
 * 無回呼函式
 * Without callback
 *
 * 當未提供 onOpenMap 時，元件不渲染任何內容
 * When onOpenMap is not provided, the component renders nothing
 */
export const NoCallback: Story = {
	args: {
		onOpenMap: undefined as any,
	},
};
