/**
 * 主題 Context Provider
 * Theme Context Provider
 * 
 * 使用 antd ConfigProvider 內建的主題切換功能
 * Uses antd ConfigProvider built-in theme switching
 */
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeConfig, theme } from 'antd';

/**
 * 主題 Context 類型
 * Theme Context type
 */
interface IThemeContext {
    /** 是否為深色模式 */
    isDark: boolean;
    /** 切換主題 */
    toggleTheme: () => void;
    /** antd 主題配置 */
    antdTheme: ThemeConfig;
}

/**
 * 建立主題配置
 * Create theme configuration
 */
const getThemeConfig = (isDark: boolean): ThemeConfig => ({
    token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
    },
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
});

// 建立 Context
const ThemeContext = createContext<IThemeContext | undefined>(undefined);

/**
 * 主題 Provider 元件
 * Theme Provider component
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    // 從 localStorage 讀取主題設定
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark') {
            setIsDark(true);
        } else if (stored === 'light') {
            setIsDark(false);
        } else {
            // 預設跟隨系統
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(prefersDark);
        }
    }, []);

    // 監聽系統主題變化
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const stored = localStorage.getItem('theme');
            if (!stored) {
                setIsDark(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    /** 切換主題 */
    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const antdTheme = getThemeConfig(isDark);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, antdTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * 使用主題的 hook
 * Hook to use theme
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}