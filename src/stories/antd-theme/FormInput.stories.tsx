/**
 * 受主題控制的 antd Input / Select 元件
 * Theme-controlled antd Input / Select component
 *
 * 使用 Storybook 工具列切換主題
 * Use the Storybook toolbar to switch themes
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input, Select, Space } from 'antd';

/**
 * 輸入框展示
 * Input showcase
 *
 * 受 theme-set.tsx 中 Input 元件覆蓋值影響：
 * - colorBgContainer: 深色 '#111827' / 淺色 '#e3f9f3'
 * - colorBorder: '#2d2926'
 */
const InputTypes = () => (
	<Space direction="vertical" size="middle" style={{ width: 400 }}>
		<Input placeholder="基本輸入框" />
		<Input placeholder="帶前綴" prefix="🔍" />
		<Input placeholder="帶後綴" suffix="📝" />
		<Input placeholder="已禁用" disabled />
		<Input.Password placeholder="密碼輸入框" />
		<Input.Search placeholder="搜尋輸入框" enterButton />
		<Input placeholder="大尺寸" size="large" />
		<Input placeholder="小尺寸" size="small" />
		<Input.TextArea placeholder="多行文字輸入" rows={3} />
		<Input.TextArea placeholder="已禁用多行" rows={3} disabled />
	</Space>
);

/**
 * 下拉選單展示
 * Select showcase
 *
 * 受 theme-set.tsx 中 Select 元件覆蓋值影響：
 * - colorBgContainer: 深色 '#111827' / 淺色 '#f5f3ff'
 */
const SelectTypes = () => (
	<Space direction="vertical" size="middle" style={{ width: 400 }}>
		<Select
			placeholder="單選"
			style={{ width: '100%' }}
			options={[
				{ value: 'option1', label: '選項一' },
				{ value: 'option2', label: '選項二' },
				{ value: 'option3', label: '選項三' },
			]}
		/>

		<Select
			mode="multiple"
			placeholder="多選"
			style={{ width: '100%' }}
			options={[
				{ value: 'tag1', label: '標籤 A' },
				{ value: 'tag2', label: '標籤 B' },
				{ value: 'tag3', label: '標籤 C' },
				{ value: 'tag4', label: '標籤 D' },
			]}
		/>

		<Select
			placeholder="已禁用"
			disabled
			style={{ width: '100%' }}
			options={[{ value: 'disabled', label: '禁用選項' }]}
		/>

		<Select
			showSearch
			placeholder="可搜尋"
			style={{ width: '100%' }}
			options={[
				{ value: 'apple', label: 'Apple' },
				{ value: 'banana', label: 'Banana' },
				{ value: 'cherry', label: 'Cherry' },
			]}
		/>
	</Space>
);

const meta = {
	/**
	 * 主題控制表單輸入元件
	 * Theme-controlled Form Input components
	 *
	 * 展示 antd Input 與 Select 元件在自訂主題下的渲染效果
	 * 包含各種輸入框類型與下拉選單模式
	 *
	 * 💡 使用 Storybook 工具列的 Theme 下拉選單切換 Light / Dark / Empty
	 * Use the Storybook toolbar "Theme" dropdown to switch Light / Dark / Empty
	 */
	title: 'Antd Theme/Form Input',
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * 預設展示 - Input + Select
 * Default view
 *
 * 工具列選擇主題即可即時切換
 * Select a theme from the toolbar to switch instantly
 */
export const Default: Story = {
	render: () => (
		<>
			<h2>Input 輸入框</h2>
			<InputTypes />
			<h2 style={{ marginTop: 32 }}>Select 下拉選單</h2>
			<SelectTypes />
		</>
	),
};
