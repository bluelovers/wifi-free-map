/**
 * 主題切換按鈕元件
 * Theme toggle button component
 *
 * 提供深色/淺色主題切換功能
 * Provides dark/light theme switching functionality
 */
'use client';

import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { IThemeContext, useTheme } from './ThemeProvider';

/**
 * 主題切換按鈕
 * Theme toggle button
 */
export default function ThemeToggle(props: {
	theme?: Pick<IThemeContext, 'toggleTheme' | 'isDark'>
})
{
	const theme = props.theme ?? useTheme();

	return (
		<Tooltip title={theme.isDark ? '切換至淺色模式' : '切換至深色模式'}>
			<Button
				type="text"
				icon={theme.isDark ? <SunOutlined /> : <MoonOutlined />}
				onClick={theme.toggleTheme}
				style={{
					fontSize: '18px',
					width: '40px',
					height: '40px',
				}}
			/>
		</Tooltip>
	);
}
