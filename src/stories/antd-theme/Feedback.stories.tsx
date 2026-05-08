/**
 * 受主題控制的 antd Alert / Tag 元件
 * Theme-controlled antd Alert / Tag component
 *
 * 使用 Storybook 工具列切換主題
 * Use the Storybook toolbar to switch themes
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Alert, Tag, Space } from 'antd';

/**
 * Alert 提示展示
 * Alert showcase
 *
 * 使用專案主題的狀態色：
 * - colorSuccess: '#6fa832'
 * - colorInfo: '#2b66bc'
 * - colorWarning: '#f0a22a'
 * - colorError: '#e04343'
 */
const AlertTypes = () => (
	<Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 600 }}>
		<Alert message="成功提示" description="操作已成功完成" type="success" showIcon closable />
		<Alert message="資訊提示" description="這是一條資訊訊息" type="info" showIcon closable />
		<Alert message="警告提示" description="請注意此操作可能產生影響" type="warning" showIcon closable />
		<Alert message="錯誤提示" description="操作失敗，請重試" type="error" showIcon closable />

		<h3>無描述</h3>
		<Alert message="成功 - 無描述" type="success" showIcon />
		<Alert message="資訊 - 無描述" type="info" showIcon />
		<Alert message="警告 - 無描述" type="warning" showIcon />
		<Alert message="錯誤 - 無描述" type="error" showIcon />

		<h3>邊框樣式</h3>
		<Alert message="Banner 樣式" type="info" banner />
	</Space>
);

/**
 * Tag 標籤展示
 * Tag showcase
 *
 * 受 theme-set.tsx 中 Tag 元件覆蓋值影響：
 * - borderRadius: 5
 */
const TagTypes = () => (
	<Space direction="vertical" size="middle">
		<Space wrap>
			<Tag>預設標籤</Tag>
			<Tag color="magenta">Magenta</Tag>
			<Tag color="red">Red</Tag>
			<Tag color="volcano">Volcano</Tag>
			<Tag color="orange">Orange</Tag>
			<Tag color="gold">Gold</Tag>
			<Tag color="lime">Lime</Tag>
			<Tag color="green">Green</Tag>
			<Tag color="cyan">Cyan</Tag>
			<Tag color="blue">Blue</Tag>
			<Tag color="geekblue">Geekblue</Tag>
			<Tag color="purple">Purple</Tag>
		</Space>

		<Space wrap>
			<Tag color="success">Success</Tag>
			<Tag color="processing">Processing</Tag>
			<Tag color="error">Error</Tag>
			<Tag color="warning">Warning</Tag>
			<Tag color="default">Default</Tag>
		</Space>

		<Space wrap>
			<Tag bordered={false}>無邊框</Tag>
			<Tag color="blue" bordered={false}>Blue 無邊框</Tag>
		</Space>
	</Space>
);

const meta = {
	/**
	 * 主題控制回饋元件
	 * Theme-controlled Feedback components
	 *
	 * 展示 antd Alert 與 Tag 元件在自訂主題下的渲染效果
	 * Alert 使用專案定義的狀態色，Tag 使用自訂 border-radius
	 *
	 * 💡 使用 Storybook 工具列的 Theme 下拉選單切換 Light / Dark / Empty
	 * Use the Storybook toolbar "Theme" dropdown to switch Light / Dark / Empty
	 */
	title: 'Antd Theme/Feedback',
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * 預設展示 - Alert + Tag
 * Default view
 *
 * 工具列選擇主題即可即時切換
 * Select a theme from the toolbar to switch instantly
 */
export const Default: Story = {
	render: () => (
		<>
			<h2>Alert 提示</h2>
			<AlertTypes />
			<h2 style={{ marginTop: 32 }}>Tag 標籤</h2>
			<TagTypes />
		</>
	),
};
