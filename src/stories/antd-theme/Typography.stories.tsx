/**
 * 受主題控制的 antd Typography 元件
 * Theme-controlled antd Typography component
 *
 * 使用 Storybook 工具列切換主題
 * Use the Storybook toolbar to switch themes
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Typography, Space, Flex } from 'antd';

const { Title, Text, Paragraph } = Typography;

/**
 * Typography 展示
 * Typography showcase
 *
 * 受專案主題影響：
 * - colorTextBase: 深色 '#e2e8f0' / 淺色 '#2d2926'
 * - colorTextSecondary: 深色 '#b388ff' / 淺色 '#8c8c8c'
 * - fontFamily: 使用 JetBrains Mono 與 Noto Sans CJK
 */
const TypographyTypes = () => (
	<Space direction="vertical" size="middle" style={{ maxWidth: 700 }}>
		<section>
			<h3>標題等級</h3>
			<Title level={1}>h1. 標題一</Title>
			<Title level={2}>h2. 標題二</Title>
			<Title level={3}>h3. 標題三</Title>
			<Title level={4}>h4. 標題四</Title>
			<Title level={5}>h5. 標題五</Title>
		</section>

		<section>
			<h3>文字樣式</h3>
			<Space direction="vertical">
				<Text>預設文字 / Default text</Text>
				<Text type="secondary">次要文字 / Secondary text</Text>
				<Text type="success">成功文字 / Success text</Text>
				<Text type="warning">警告文字 / Warning text</Text>
				<Text type="danger">危險文字 / Danger text</Text>
				<Text disabled>禁用文字 / Disabled text</Text>
				<Text mark>標記文字 / Marked text</Text>
				<Text code>程式碼文字 / Code text</Text>
				<Text keyboard>快捷鍵 / Keyboard text</Text>
				<Text underline>底線文字 / Underlined text</Text>
				<Text delete>刪除線文字 / Deleted text</Text>
				<Text strong>粗體文字 / Strong text</Text>
				<Text italic>斜體文字 / Italic text</Text>
			</Space>
		</section>

		<section>
			<h3>段落</h3>
			<Paragraph>
				這是段落文字。本專案使用 JetBrains Mono 等寬字體作為預設字型，
				搭配 Noto Sans CJK 作為中日韓文字顯示。
			</Paragraph>
			<Paragraph copyable>
				這段文字可以點擊複製 / This text can be copied
			</Paragraph>
			<Paragraph ellipsis>
				這段文字在超過容器寬度時會自動縮減並顯示省略號，
				適合用於列表中的簡介文字或摘要內容。This text will be automatically
				truncated with ellipsis when it exceeds the container width.
			</Paragraph>
		</section>

		<section>
			<h3>文字尺寸</h3>
			<Flex gap="large" align="baseline" wrap>
				<Title level={1} style={{ margin: 0 }}>Aa</Title>
				<Title level={2} style={{ margin: 0 }}>Aa</Title>
				<Title level={3} style={{ margin: 0 }}>Aa</Title>
				<Title level={4} style={{ margin: 0 }}>Aa</Title>
				<Title level={5} style={{ margin: 0 }}>Aa</Title>
			</Flex>
		</section>
	</Space>
);

const meta = {
	/**
	 * 主題控制排版元件
	 * Theme-controlled Typography
	 *
	 * 展示 antd Typography 元件（Title、Text、Paragraph）
	 * 在自訂主題下的字體、顏色與樣式效果
	 *
	 * 💡 使用 Storybook 工具列的 Theme 下拉選單切換 Light / Dark / Empty
	 * Use the Storybook toolbar "Theme" dropdown to switch Light / Dark / Empty
	 */
	title: 'Antd Theme/Typography',
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * 預設展示 - Typography
 * Default view
 *
 * 工具列選擇主題即可即時切換
 * Select a theme from the toolbar to switch instantly
 */
export const Default: Story = {
	render: () => <TypographyTypes />,
};
