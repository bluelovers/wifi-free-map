import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CollapsibleCard } from './CollapsibleCard';
import { Flex, Switch, Tag, Typography } from 'antd';
import { expect, within, userEvent } from 'storybook/test';

const meta = {
	title: 'UI/CollapsibleCard',
	component: CollapsibleCard,
	tags: ['autodocs'],
} satisfies Meta<typeof CollapsibleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 預設：展開狀態，顯示內容
 * Default: expanded state with visible content
 */
export const Expanded: Story = {
	args: {
		title: '搜尋與過濾',
		children: (
			<Flex vertical gap="middle">
				<Typography.Text>這是 Card 的內容區域</Typography.Text>
				<Typography.Text>This is the card content area</Typography.Text>
				<Flex gap="middle" wrap>
					<Switch checkedChildren="WiFi" unCheckedChildren="WiFi" defaultChecked size="small" />
					<Switch checkedChildren="充電" unCheckedChildren="充電" size="small" />
				</Flex>
			</Flex>
		),
	},
};

/**
 * 預設摺疊：內容初始隱藏
 * Default collapsed: content hidden initially
 */
export const Collapsed: Story = {
	args: {
		title: '其他選項',
		defaultCollapsed: true,
		children: (
			<Flex vertical gap="middle">
				<Typography.Text>右鍵點擊移動定位點</Typography.Text>
				<Flex align="center" gap="small">
					<Typography.Text>Google 地圖：</Typography.Text>
					<Switch size="small" />
				</Flex>
				<Flex align="center" gap="small">
					<Typography.Text>顯示範圍框線</Typography.Text>
					<Switch size="small" />
				</Flex>
			</Flex>
		),
	},
};

/**
 * 自訂 extra：在摺疊按鈕旁加入標籤
 * Custom extra: add a tag next to the collapse toggle
 */
export const WithExtra: Story = {
	args: {
		title: '進階設定',
		extra: <Tag color="blue">Beta</Tag>,
		children: (
			<Typography.Text>自訂 extra 內容會顯示在摺疊按鈕右側</Typography.Text>
		),
	},
};

/**
 * 完全自訂 extra：隱藏預設摺疊按鈕
 * Fully custom extra: hide the default collapse toggle
 */
export const CustomExtraOnly: Story = {
	args: {
		title: '自訂操作',
		extra: <Switch checkedChildren="開" unCheckedChildren="關" size="small" />,
		hideDefaultToggle: true,
		children: (
			<Typography.Text>完全自訂 extra，無預設摺疊按鈕</Typography.Text>
		),
	},
};

/**
 * 非摺疊模式：等同於一般 Card，無摺疊按鈕，始終顯示內容
 * Non-collapsible mode: behaves as a plain Card, no toggle, always visible
 */
export const NonCollapsible: Story = {
	args: {
		title: '一般卡片',
		collapsible: false,
		children: (
			<Flex vertical gap="middle">
				<Typography.Text>此 Card 沒有摺疊功能，內容始終顯示。</Typography.Text>
				<Typography.Text>This Card is not collapsible — content is always visible.</Typography.Text>
				<Flex gap="middle" wrap>
					<Switch checkedChildren="WiFi" unCheckedChildren="WiFi" defaultChecked size="small" />
					<Switch checkedChildren="充電" unCheckedChildren="充電" size="small" />
				</Flex>
			</Flex>
		),
	},
};

export const InteractionTest: Story = {
  ...Expanded,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. 驗證標題是否存在
    await expect(canvas.getByText('搜尋與過濾')).toBeInTheDocument();

    // 2. 假設 CollapsibleCard 點擊標題會收合 (需根據你實際組件邏輯調整)
    // 找到摺疊按鈕並點擊
    const toggleButton = canvas.getByRole('button'); // 如果你的摺疊按鈕是 button 標籤
    await userEvent.click(toggleButton);

    // 3. 驗證內容是否被隱藏 (例如檢測容器高度或 style)
    // 注意：如果是 antd 內建動畫，可能需要等待動畫結束
    const content = canvas.getByText('這是 Card 的內容區域');
    // 如果是真正的 DOM 移除：
    // await expect(content).not.toBeInTheDocument();
    // 如果只是 CSS 隱藏：
    await expect(content).not.toBeVisible();

    // 4. 再次點擊展開
    await userEvent.click(toggleButton);
    await expect(canvas.getByText('這是 Card 的內容區域')).toBeVisible();
  },
};
