/**
 * GPS 脈衝 SVG 圖示 Storybook Story
 * GPS pulse SVG icon Storybook story
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GpsPulseSvg } from './GpsPulseSvg';

const meta = {
	/**
	 * GPS 脈衝 SVG 圖示
	 * GPS pulse SVG icon
	 *
	 * 顯示用於定位的脈衝動畫圓圈
	 * 自 svg.ts 的 createSvgGpsPulse() 切割為獨立 React 元件，無 Leaflet 依賴
	 * Displays a pulsing circle animation for geolocation
	 * Extracted from createSvgGpsPulse() in svg.ts; no Leaflet dependency
	 */
	title: 'Components/GpsPulseSvg',
	component: GpsPulseSvg,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof GpsPulseSvg>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 預設藍色
 * Default blue
 *
 * 使用預設的藍色（#1890ff）顯示 GPS 脈衝圖示
 * 外圈半透明（opacity 0.3），內圈實心（opacity 0.7）
 * Default blue (#1890ff) GPS pulse icon
 * Outer ring semi-transparent (opacity 0.3), inner circle solid (opacity 0.7)
 */
export const Default: Story = {};

/**
 * 自訂顏色（綠色）
 * Custom color (green)
 *
 * 使用綠色系顯示 GPS 脈衝圖示
 * Green color GPS pulse icon
 */
export const GreenColor: Story = {
	args: {
		color: '#52c41a',
		fillColor: '#52c41a',
	},
};

/**
 * 自訂大小（放大）
 * Custom size (larger)
 *
 * 使用 width/height 控制顯示尺寸為 110px
 * Display size set to 110px via width/height
 */
export const LargeSize: Story = {
	args: {
		width: 110,
		height: 110,
		color: '#ff4d4f',
		fillColor: '#ff4d4f',
	},
};
