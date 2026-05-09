/**
 * 彩色多選下拉選單 Storybook Story
 * Colored multi-select Storybook story
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ColoredSelect } from './ColoredSelect';
import type { IColoredSelectItem } from './ColoredSelect';
import React from 'react';

/**
 * 建立模擬的帶顏色選項
 * Create mock colored options
 *
 * 模擬真實應用中從 ITagCategoryItem 轉換而來的選項格式
 * 包含 value、label、color 與 colorPreset（含 text10.toRgbString）
 * Simulates the option format converted from ITagCategoryItem in the real app
 */
const mockOptions: (IColoredSelectItem & {
	colorPreset: { text10: { toRgbString(): string } };
})[] = [
	{
		value: '咖啡廳',
		label: '咖啡廳',
		color: '#722ed1',
		colorPreset: { text10: { toRgbString: () => '#ffffff' } },
	},
	{
		value: '圖書館',
		label: '圖書館',
		color: '#13c2c2',
		colorPreset: { text10: { toRgbString: () => '#ffffff' } },
	},
	{
		value: '捷運站',
		label: '捷運站',
		color: '#eb2f96',
		colorPreset: { text10: { toRgbString: () => '#ffffff' } },
	},
	{
		value: '政府機關',
		label: '政府機關',
		color: '#fa8c16',
		colorPreset: { text10: { toRgbString: () => '#ffffff' } },
	},
	{
		value: '百貨商場',
		label: '百貨商場',
		color: '#52c41a',
		colorPreset: { text10: { toRgbString: () => '#ffffff' } },
	},
	{
		value: '公園',
		label: '公園',
		color: '#1890ff',
		colorPreset: { text10: { toRgbString: () => '#ffffff' } },
	},
];

/**
 * 可互動的 ColoredSelect 包裝器
 * Interactive ColoredSelect wrapper
 *
 * 使用 React state 管理 value，讓下拉選單可以真正選取/取消選取
 * Manages value via React state so the dropdown is truly interactive
 */
/**
 * 可互動的 ColoredSelect 包裝器
 * Interactive ColoredSelect wrapper
 *
 * 使用 React state 管理 value，讓下拉選單可以真正選取/取消選取
 * 外層容器設定固定寬度，避免 100% 在無寬度父層下失效
 * Manages value via React state so the dropdown is truly interactive
 * Outer container sets a fixed width so 100% doesn't collapse to zero
 */
function InteractiveColoredSelect(props: {
	initialValue?: string[];
	placeholder?: string;
	options: typeof mockOptions;
})
{
	const [value, setValue] = React.useState<string[]>(props.initialValue ?? []);
	return (
		<div style={{ width: 320 }}>
			<ColoredSelect
				placeholder={props.placeholder}
				options={props.options}
				value={value}
				onChange={(newValue) => setValue(newValue as string[])}
			/>
		</div>
	);
}

const meta = {
	/**
	 * 彩色多選下拉選單
	 * Colored multi-select
	 *
	 * 支援自訂 tag 顏色與文字顏色的多選 Select 元件
	 * 使用 colorPreset 控制標籤顏色
	 *
	 * ⚠️ 所有 story 皆使用 React state 管理 value，為可互動模式
	 * 點擊下拉選項即可選取/取消選取，觀察彩色標籤即時變化
	 *
	 * Multi-select component with custom tag and text colors via colorPreset
	 *
	 * ⚠️ All stories use React state to manage value — fully interactive.
	 * Click dropdown options to select/deselect and see colored tags update live.
	 */
	title: 'Components/ColoredSelect',
	component: ColoredSelect,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	args: {
		placeholder: '選擇分類...',
		options: mockOptions,
	},
} satisfies Meta<typeof ColoredSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 空狀態（可互動）
 * Empty state (interactive)
 *
 * 無任何預選值，完全從零開始選擇
 * 點擊下拉按鈕即可展開選單選取項目
 * No pre-selected values — start from scratch
 * Click the dropdown to open and select items
 */
export const Empty: Story = {
	args: {},
	render: (args) => (
		<InteractiveColoredSelect
			initialValue={[]}
			placeholder={args.placeholder}
			options={args.options!}
		/>
	),
};

/**
 * 已選擇部分選項（可互動）
 * With selection (interactive)
 *
 * 預選「咖啡廳」和「圖書館」，仍可繼續增減
 * 展示彩色標籤的渲染效果
 * Pre-selected "咖啡廳" and "圖書館" — can still add/remove more
 * Demonstrates colored tag rendering
 */
export const WithSelection: Story = {
	args: {},
	render: (args) => (
		<InteractiveColoredSelect
			initialValue={['咖啡廳', '圖書館']}
			placeholder={args.placeholder}
			options={args.options!}
		/>
	),
};

/**
 * 多個選項已選（可互動）
 * Multiple selections (interactive)
 *
 * 預選 4 個項目，測試多標籤佈局
 * 仍可繼續選取或取消
 * Pre-selected 4 items — tests multi-tag layout
 * Can still select or deselect
 */
export const MultipleSelection: Story = {
	args: {},
	render: (args) => (
		<InteractiveColoredSelect
			initialValue={['咖啡廳', '圖書館', '捷運站', '政府機關']}
			placeholder={args.placeholder}
			options={args.options!}
		/>
	),
};

/**
 * 全部選取（可互動）
 * All selected (interactive)
 *
 * 預選所有項目，測試 maxTagCount="responsive" 的摺疊效果
 * 可取消部分項目觀察摺疊行為變化
 * Pre-selected all items — tests maxTagCount="responsive" collapse
 * Deselect items to observe collapse behavior changes
 */
export const AllSelected: Story = {
	args: {},
	render: (args) => (
		<InteractiveColoredSelect
			initialValue={mockOptions.map(o => o.value)}
			placeholder={args.placeholder}
			options={args.options!}
		/>
	),
};
