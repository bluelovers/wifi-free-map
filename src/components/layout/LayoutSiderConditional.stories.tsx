/**
 * 條件式側邊欄 Storybook Story
 * Conditional layout sider Storybook story
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Layout } from 'antd';
import { LayoutSiderConditional } from './layout';

const { Content } = Layout;

/**
 * Story 包裝元件：提供 antd Layout 容器
 * Story wrapper: provides antd Layout container
 */
const SiderDecorator = (Story: React.FC) => (
	<Layout style={{ height: 200, width: 400, border: '1px solid #d9d9d9', borderRadius: 8 }}>
		<Story />
		<Content style={{ padding: 16, background: '#f0f2f5' }}>
			<div>主內容區 / Main Content</div>
		</Content>
	</Layout>
);

const meta = {
	/**
	 * 條件式側邊欄
	 * Conditional layout sider
	 *
	 * 包裝 antd Layout.Sider，僅在未摺疊時顯示 children
	 * 適合需要動態隱藏側邊欄內容的場景
	 * Wraps antd Layout.Sider; only shows children when not collapsed
	 */
	title: 'Components/LayoutSiderConditional',
	component: LayoutSiderConditional,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	decorators: [SiderDecorator],
} satisfies Meta<typeof LayoutSiderConditional>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 展開狀態
 * Expanded state
 *
 * 側邊欄展開，顯示子內容
 * Sidebar expanded, children are visible
 */
export const Expanded: Story = {
	args: {
		collapsed: false,
		children: <div style={{ padding: 16, width: 150 }}>側邊欄內容 / Sidebar Content</div>,
	},
};

/**
 * 摺疊狀態
 * Collapsed state
 *
 * 側邊欄摺疊，子內容隱藏（僅顯示 antd Sider 預設的摺疊圖示）
 * Sidebar collapsed, children hidden (only antd Sider's default collapse icon visible)
 */
export const Collapsed: Story = {
	args: {
		collapsed: true,
		children: <div style={{ padding: 16, width: 150 }}>側邊欄內容 / Sidebar Content</div>,
	},
};
