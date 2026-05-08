/**
 * 受主題控制的所有 antd 元件展示頁
 * Theme-controlled antd component showcase
 *
 * 使用 Storybook 工具列切換主題
 * Use the Storybook toolbar to switch themes
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
	Alert,
	Button,
	Card,
	Collapse,
	Flex,
	Input,
	Select,
	Space,
	Switch,
	Tag,
	Tooltip,
	Typography,
} from 'antd';

const { Title, Text } = Typography;

/**
 * 全元件主題展示
 * Full component theme showcase
 *
 * 一次展示本專案所有使用的 antd 元件在自訂主題下的效果
 * 方便快速比較深色/淺色主題的視覺差異
 */
function ShowcaseContent()
{
	return (
		<Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 800 }}>
			{/* Header */}
			<div>
				<Title>🎨 主題展示</Title>
				<Text type="secondary">
					本專案自訂主題（Seed Token 004）下的 antd 元件渲染效果
				</Text>
			</div>

			{/* Button */}
			<Card title="Button" size="small">
				<Flex gap="middle" wrap>
					<Button type="primary">Primary</Button>
					<Button>Default</Button>
					<Button type="dashed">Dashed</Button>
					<Button type="text">Text</Button>
					<Button type="link">Link</Button>
					<Button type="primary" danger>Danger</Button>
					<Button type="primary" disabled>Disabled</Button>
				</Flex>
				<Flex gap="middle" wrap style={{ marginTop: 12 }}>
					<Button type="primary" size="large">Large</Button>
					<Button type="primary" size="small">Small</Button>
					<Tooltip title="Tooltip 提示">
						<Button type="primary">Hover</Button>
					</Tooltip>
				</Flex>
			</Card>

			{/* Switch */}
			<Card title="Switch" size="small">
				<Flex gap="middle" align="center" wrap>
					<Switch defaultChecked />
					<Switch />
					<Switch loading defaultChecked />
					<Switch disabled />
					<Switch checkedChildren="開" unCheckedChildren="關" defaultChecked />
				</Flex>
			</Card>

			{/* Input */}
			<Card title="Input" size="small">
				<Space direction="vertical" style={{ width: '100%' }}>
					<Input placeholder="基本輸入框" />
					<Input.Search placeholder="搜尋..." enterButton />
					<Input.Password placeholder="密碼" />
					<Input.TextArea placeholder="多行文字" rows={2} />
				</Space>
			</Card>

			{/* Select */}
			<Card title="Select" size="small">
				<Space direction="vertical" style={{ width: '100%' }}>
					<Select
						placeholder="單選"
						style={{ width: '100%' }}
						options={[
							{ value: 'a', label: '選項 A' },
							{ value: 'b', label: '選項 B' },
							{ value: 'c', label: '選項 C' },
						]}
					/>
					<Select
						mode="multiple"
						placeholder="多選"
						style={{ width: '100%' }}
						options={[
							{ value: 'x', label: '標籤 X' },
							{ value: 'y', label: '標籤 Y' },
							{ value: 'z', label: '標籤 Z' },
						]}
					/>
				</Space>
			</Card>

			{/* Tag */}
			<Card title="Tag" size="small">
				<Flex gap="small" wrap>
					<Tag>Default</Tag>
					<Tag color="magenta">Magenta</Tag>
					<Tag color="red">Red</Tag>
					<Tag color="blue">Blue</Tag>
					<Tag color="green">Green</Tag>
					<Tag color="orange">Orange</Tag>
					<Tag color="purple">Purple</Tag>
					<Tag color="cyan">Cyan</Tag>
					<Tag color="success">Success</Tag>
					<Tag color="processing">Processing</Tag>
					<Tag color="warning">Warning</Tag>
					<Tag color="error">Error</Tag>
				</Flex>
			</Card>

			{/* Alert */}
			<Card title="Alert" size="small">
				<Space direction="vertical" style={{ width: '100%' }}>
					<Alert message="成功提示" type="success" showIcon />
					<Alert message="資訊提示" type="info" showIcon />
					<Alert message="警告提示" type="warning" showIcon />
					<Alert message="錯誤提示" type="error" showIcon />
				</Space>
			</Card>

			{/* Collapse */}
			<Card title="Collapse" size="small">
				<Collapse
					items={[
						{
							key: '1',
							label: '摺疊面板範例',
							children: <Text>面板內容區域 - 展示 antd Collapse 元件</Text>,
						},
						{
							key: '2',
							label: '另一面板',
							children: <Text>更多內容...</Text>,
						},
					]}
				/>
			</Card>

			{/* Card variants */}
			<Card title="Card 變體" size="small">
				<Flex gap="middle" wrap>
					<Card size="small" style={{ width: 180 }}>
						預設卡片
					</Card>
					<Card size="small" variant="outlined" style={{ width: 180 }}>
						Outlined 卡片
					</Card>
					<Card size="small" hoverable style={{ width: 180 }}>
						可懸停卡片
					</Card>
				</Flex>
			</Card>
		</Space>
	);
}

const meta = {
	/**
	 * 受主題控制的所有 antd 元件展示
	 * Theme-controlled antd component showcase
	 *
	 * 一次展示本專案使用的所有 antd 元件
	 * 方便快速比較三種主題下的視覺差異
	 * 包含 Button、Switch、Input、Select、Tag、Alert、Collapse、Card 等
	 *
	 * 💡 使用 Storybook 工具列的 Theme 下拉選單切換 Light / Dark / Empty
	 * Use the Storybook toolbar "Theme" dropdown to switch Light / Dark / Empty
	 */
	title: 'Antd Theme/Showcase',
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * 預設展示 - 全元件
 * Default view
 *
 * 工具列選擇主題即可即時切換
 * Select a theme from the toolbar to switch instantly
 */
export const Default: Story = {
	render: () => <ShowcaseContent />,
};
