/**
 * 受主題控制的 antd Button / Switch / Tooltip 元件
 * Theme-controlled antd Button / Switch / Tooltip component
 *
 * 使用 Storybook 工具列切換主題
 * Use the Storybook toolbar to switch themes
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button, Switch, Tooltip, Space, Flex } from 'antd';

/**
 * 按鈕類型展示
 * Button type showcase
 *
 * 展示 antd Button 在專案主題下的各種類型
 * 受 theme-set.tsx 中 Button 元件覆蓋值影響：
 * - fontWeight: 800
 * - colorBorder: '#2d2926'
 * - colorFillSecondary: 深色 '#374151' / 淺色 '#fff7ed'
 */
const ButtonTypes = () => (
	<Space direction="vertical" size="middle" style={{ width: '100%' }}>
		<Flex gap="middle" wrap>
			<Button type="primary">Primary</Button>
			<Button type="default">Default</Button>
			<Button type="dashed">Dashed</Button>
			<Button type="text">Text</Button>
			<Button type="link">Link</Button>
		</Flex>

		<Flex gap="middle" wrap>
			<Button type="primary" size="large">Large</Button>
			<Button type="primary" size="middle">Middle</Button>
			<Button type="primary" size="small">Small</Button>
		</Flex>

		<Flex gap="middle" wrap>
			<Button type="primary" danger>Danger</Button>
			<Button type="default" danger>Danger Default</Button>
			<Button type="primary" disabled>Disabled</Button>
			<Button type="default" disabled>Disabled</Button>
		</Flex>

		<Tooltip title="Tooltip 提示文字">
			<Button type="primary">Hover for Tooltip</Button>
		</Tooltip>
	</Space>
);

/**
 * Switch 切換開關展示
 * Switch toggle showcase
 */
const SwitchTypes = () => (
	<Space direction="vertical" size="middle">
		<Flex gap="middle" align="center">
			<Switch defaultChecked />
			<Switch />
			<Switch loading defaultChecked />
			<Switch disabled />
			<Switch disabled defaultChecked />
		</Flex>
		<Flex gap="middle" align="center">
			<Switch checkedChildren="開" unCheckedChildren="關" defaultChecked />
			<Switch checkedChildren="ON" unCheckedChildren="OFF" />
		</Flex>
	</Space>
);

const meta = {
	/**
	 * 主題控制按鈕、開關與提示
	 * Theme-controlled Button, Switch & Tooltip
	 *
	 * 展示本專案使用的 antd Button、Switch、Tooltip 元件
	 * 在自訂主題（Seed Token 004）下的渲染效果
	 *
	 * 💡 使用 Storybook 工具列的 Theme 下拉選單切換 Light / Dark / Empty
	 * Use the Storybook toolbar "Theme" dropdown to switch Light / Dark / Empty
	 */
	title: 'Antd Theme/Button',
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * 預設展示 - Button + Switch + Tooltip
 * Default view
 *
 * 工具列選擇主題即可即時切換
 * Select a theme from the toolbar to switch instantly
 */
export const Default: Story = {
	render: () => (
		<>
			<h2>Buttons</h2>
			<ButtonTypes />
			<h2 style={{ marginTop: 32 }}>Switches</h2>
			<SwitchTypes />
		</>
	),
};
