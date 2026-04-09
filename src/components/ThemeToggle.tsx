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
import { useTheme } from './ThemeProvider';

/**
 * 主題切換按鈕
 * Theme toggle button
 */
export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <Tooltip title={isDark ? '切換至淺色模式' : '切換至深色模式'}>
            <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                style={{
                    fontSize: '18px',
                    width: '40px',
                    height: '40px',
                }}
            />
        </Tooltip>
    );
}