/**
 * 受主題控制的 antd Card 元件
 * Theme-controlled antd Card component
 *
 * 使用 Storybook 工具列切換主題
 * Use the Storybook toolbar to switch themes
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, Flex } from 'antd';

/**
 * 卡片展示內容
 * Card display content
 *
 * 受 theme-set.tsx 中 Card 元件覆蓋值影響：
 * - colorBgContainer: 深色 '#1e1b4bae' / 淺色 '#eef2ff'
 * - colorBorderSecondary: 深色 '#5e5ae0' / 淺色 '#2d2926'
 * - boxShadow: 深色 '4px 4px 0px #0f172a' / 淺色 '4px 4px 0px #c7d2fe'
 */
const CardTypes = () => (
	<Flex gap="middle" wrap>
		<Card
			title="預設卡片"
			style={{ width: 280 }}
		>
			<p>卡片內容</p>
			<p>這是預設大小的卡片</p>
		</Card>

		<Card
			title="小尺寸卡片"
			size="small"
			style={{ width: 280 }}
		>
			<p>小尺寸卡片內容</p>
		</Card>

		<Card
			title="可懸停卡片"
			hoverable
			style={{ width: 280 }}
		>
			<p>滑鼠懸停時有互動效果</p>
		</Card>
	</Flex>
);

/**
 * 帶邊框變體的卡片
 * Card with outlined variant
 */
const CardOutlined = () => (
	<Flex gap="middle" wrap>
		<Card
			title="Outlined 卡片"
			variant="outlined"
			style={{ width: 280 }}
		>
			<p>使用 variant="outlined" 的卡片</p>
		</Card>

		<Card
			title="Outlined + 小尺寸"
			variant="outlined"
			size="small"
			style={{ width: 280 }}
		>
			<p>小尺寸 outlined 卡片</p>
		</Card>

		<Card
			title="Outlined + 可懸停"
			variant="outlined"
			hoverable
			style={{ width: 280 }}
		>
			<p>可懸停 outlined 卡片</p>
		</Card>
	</Flex>
);

const meta = {
	/**
	 * 主題控制卡片
	 * Theme-controlled Card
	 *
	 * 展示 antd Card 在自訂主題下的各種變體
	 * 包含預設、小尺寸、可懸停與 outlined 樣式
	 *
	 * 💡 使用 Storybook 工具列的 Theme 下拉選單切換 Light / Dark / Empty
	 * Use the Storybook toolbar "Theme" dropdown to switch Light / Dark / Empty
	 */
	title: 'Antd Theme/Card',
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * 預設展示 - Card
 * Default view
 *
 * 工具列選擇主題即可即時切換
 * Select a theme from the toolbar to switch instantly
 */
export const Default: Story = {
	render: () => (
		<>
			<h2>Card 變體</h2>
			<CardTypes />
			<h2 style={{ marginTop: 32 }}>Outlined Card 變體</h2>
			<CardOutlined />
		</>
	),
};
