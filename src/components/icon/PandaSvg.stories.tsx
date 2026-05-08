/**
 * Panda SVG 圖示 Storybook Story
 * Panda SVG icon Storybook story
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PandaSvg } from './svg-other';

const meta = {
	/**
	 * Panda SVG 圖示
	 * Panda SVG icon
	 *
	 * 複製自 antd 官方 Icon 範例的純 SVG 元件，無任何外部依賴
	 * Pure SVG component copied from antd official Icon demo, no external dependencies
	 *
	 * @see https://ant.design/components/icon
	 */
	title: 'Components/PandaSvg',
	component: PandaSvg,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof PandaSvg>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 預設大小
 * Default size
 *
 * 使用預設的 1em 尺寸顯示熊貓圖示
 * Displays the panda icon at default 1em size
 */
export const Default: Story = {};

/**
 * 大尺寸
 * Large size
 *
 * 使用 4em 尺寸顯示熊貓圖示，展示 SVG 可縮放特性
 * Displays the panda icon at 4em size, showing SVG scalability
 */
export const Large: Story = {
	render: () => (
		<div style={{ fontSize: '4em' }}>
			<PandaSvg />
		</div>
	),
};

/**
 * 自訂顏色
 * Custom color
 *
 * 透過 CSS color 屬性改變 SVG 圖示顏色
 * Changes the SVG icon color via CSS color property
 */
export const CustomColor: Story = {
	render: () => (
		<div style={{ fontSize: '3em', color: '#eb2f96' }}>
			<PandaSvg />
		</div>
	),
};
