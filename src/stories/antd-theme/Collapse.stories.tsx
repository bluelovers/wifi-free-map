/**
 * 受主題控制的 antd Collapse 元件
 * Theme-controlled antd Collapse component
 *
 * 使用 Storybook 工具列切換主題
 * Use the Storybook toolbar to switch themes
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Collapse, Space } from 'antd';

/**
 * Collapse 面板展示
 * Collapse showcase
 *
 * 受 theme-set.tsx 中 Collapse 元件覆蓋值影響：
 * - headerBg: 深色 '#1f2937' / 淺色 '#faf7f0'
 */
const CollapseTypes = () => (
	<Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 600 }}>
		<Collapse
			defaultActiveKey={['1']}
			items={[
				{
					key: '1',
					label: '面板一：基本資訊',
					children: <p>這是摺疊面板的內容區域，可放入任何 React 節點。</p>,
				},
				{
					key: '2',
					label: '面板二：詳細說明',
					children: (
						<div>
							<p>摺疊元件常用於 FAQ、設定選項、詳細資訊等場景。</p>
							<p>此元件受主題控制，標題背景色會隨主題切換。</p>
						</div>
					),
				},
				{
					key: '3',
					label: '面板三：巢狀內容',
					children: (
						<Collapse
							size="small"
							items={[
								{
									key: '3-1',
									label: '巢狀項目 A',
									children: <p>巢狀摺疊內容</p>,
								},
								{
									key: '3-2',
									label: '巢狀項目 B',
									children: <p>另一層摺疊內容</p>,
								},
							]}
						/>
					),
				},
			]}
		/>

		<h3>無邊框樣式</h3>
		<Collapse
			ghost
			items={[
				{
					key: 'g1',
					label: 'Ghost 面板 A',
					children: <p>無邊框樣式內容</p>,
				},
				{
					key: 'g2',
					label: 'Ghost 面板 B',
					children: <p>無邊框樣式內容</p>,
				},
			]}
		/>

		<h3>大尺寸 / 小尺寸</h3>
		<Collapse
			size="large"
			items={[
				{
					key: 'l1',
					label: '大尺寸面板',
					children: <p>大尺寸摺疊面板</p>,
				},
			]}
		/>
		<Collapse
			size="small"
			items={[
				{
					key: 's1',
					label: '小尺寸面板',
					children: <p>小尺寸摺疊面板</p>,
				},
			]}
		/>
	</Space>
);

const meta = {
	/**
	 * 主題控制摺疊面板
	 * Theme-controlled Collapse
	 *
	 * 展示 antd Collapse 元件在自訂主題下的渲染效果
	 * 包含預設、無邊框、大尺寸與小尺寸變體
	 *
	 * 💡 使用 Storybook 工具列的 Theme 下拉選單切換 Light / Dark / Empty
	 * Use the Storybook toolbar "Theme" dropdown to switch Light / Dark / Empty
	 */
	title: 'Antd Theme/Collapse',
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * 預設展示 - Collapse
 * Default view
 *
 * 工具列選擇主題即可即時切換
 * Select a theme from the toolbar to switch instantly
 */
export const Default: Story = {
	render: () => <CollapseTypes />,
};
