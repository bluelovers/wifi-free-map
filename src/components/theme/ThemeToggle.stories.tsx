/**
 * 主題切換按鈕 Storybook Story
 * Theme toggle button Storybook story
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import ThemeToggle from './ThemeToggle';

const meta = {
	/**
	 * 主題切換按鈕
	 * Theme toggle button
	 *
	 * 提供深色/淺色主題切換功能，可透過 `theme` prop 直接注入 mock context
	 * Supports dark/light theme switching; mock context can be injected via `theme` prop
	 */
	title: 'Components/ThemeToggle',
	component: ThemeToggle,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	args: {
		theme: {
			isDark: false,
			toggleTheme: fn(),
		},
	},
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 淺色模式
 * Light mode
 *
 * 顯示淺色主題下的主題切換按鈕（月亮圖示，點擊切換至深色）
 * Displays the theme toggle in light mode (moon icon, click to switch to dark)
 */
export const LightMode: Story = {
	args: {
		theme: {
			isDark: false,
			toggleTheme: fn(),
		},
	},
};

/**
 * 深色模式
 * Dark mode
 *
 * 顯示深色主題下的主題切換按鈕（太陽圖示，點擊切換至淺色）
 * Displays the theme toggle in dark mode (sun icon, click to switch to light)
 */
export const DarkMode: Story = {
	args: {
		theme: {
			isDark: true,
			toggleTheme: fn(),
		},
	},
};
