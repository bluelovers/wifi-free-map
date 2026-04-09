/**
 * 主題 Context Provider
 * Theme Context Provider
 * 
 * 使用 antd ConfigProvider 內建的主題切換功能
 * Uses antd ConfigProvider built-in theme switching
 * 
 * 參考：https://ant.design/docs/react/customize-theme-cn
 */
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeConfig, theme } from 'antd';

/**
 * antd Design Tokens 類型
 * antd Design Tokens type
 */
interface IAntdTokens {
    // 主色調
    colorPrimary: string;
    colorPrimaryHover: string;
    colorPrimaryActive: string;
    colorPrimaryBg: string;
    colorPrimaryBgHover: string;
    
    // 輔助色
    colorSuccess: string;
    colorWarning: string;
    colorError: string;
    colorInfo: string;
    
    // 背景色
    colorBgContainer: string;
    colorBgElevated: string;
    colorBgLayout: string;
    colorBgSpotlight: string;
    
    // 文字色
    colorText: string;
    colorTextSecondary: string;
    colorTextDisabled: string;
    
    // 邊框色
    colorBorder: string;
    colorBorderSecondary: string;
    
    // 陰影
    boxShadow: string;
    boxShadowSecondary: string;
    
    // 圓角
    borderRadius: number;
    borderRadiusLG: number;
    borderRadiusSM: number;
    
    // 字體大小
    fontSize: number;
    fontSizeLG: number;
    fontSizeSM: number;
    
    // 間距
    padding: number;
    paddingLG: number;
    paddingSM: number;
    margin: number;
    marginLG: number;
    marginSM: number;
}

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
    /** antd Design Tokens (用於 CSS 變數) */
    antdTokens: IAntdTokens;
}

/**
 * 將 antd tokens 轉換為 CSS 變數物件
 * Convert antd tokens to CSS variables object
 */
const tokensToCssVars = (token: any): IAntdTokens => ({
    // 主色調
    colorPrimary: token.colorPrimary,
    colorPrimaryHover: token.colorPrimaryHover || token.colorPrimary,
    colorPrimaryActive: token.colorPrimaryActive || token.colorPrimary,
    colorPrimaryBg: token.colorPrimaryBg || token.colorPrimary,
    colorPrimaryBgHover: token.colorPrimaryBgHover || token.colorPrimaryBg,
    
    // 輔助色
    colorSuccess: token.colorSuccess,
    colorWarning: token.colorWarning,
    colorError: token.colorError,
    colorInfo: token.colorInfo,
    
    // 背景色
    colorBgContainer: token.colorBgContainer,
    colorBgElevated: token.colorBgElevated,
    colorBgLayout: token.colorBgLayout,
    colorBgSpotlight: token.colorBgSpotlight || token.colorBgContainer,
    
    // 文字色
    colorText: token.colorText,
    colorTextSecondary: token.colorTextSecondary,
    colorTextDisabled: token.colorTextDisabled,
    
    // 邊框色
    colorBorder: token.colorBorder,
    colorBorderSecondary: token.colorBorderSecondary || token.colorBorder,
    
    // 陰影
    boxShadow: token.boxShadow,
    boxShadowSecondary: token.boxShadowSecondary || token.boxShadow,
    
    // 圓角
    borderRadius: token.borderRadius,
    borderRadiusLG: token.borderRadiusLG,
    borderRadiusSM: token.borderRadiusSM,
    
    // 字體大小
    fontSize: token.fontSize,
    fontSizeLG: token.fontSizeLG,
    fontSizeSM: token.fontSizeSM,
    
    // 間距
    padding: token.padding,
    paddingLG: token.paddingLG,
    paddingSM: token.paddingSM,
    margin: token.margin,
    marginLG: token.marginLG,
    marginSM: token.marginSM,
});

/**
 * 建立 antd 主題配置 (包含 token)
 * Create antd theme configuration (includes token)
 */
const createThemeConfig = (isDark: boolean): { config: ThemeConfig; tokens: IAntdTokens } => {
    // 淺色模式顏色
    const lightColors = {
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#fafafa',
        colorBgSpotlight: '#f5f5f5',
        
        colorText: '#000000e0',
        colorTextSecondary: '#00000073',
        colorTextDisabled: '#0000003f',
        
        colorBorder: '#d9d9d9',
        colorBorderSecondary: '#f0f0f0',
        
        boxShadow: '0 2px 8px #00000026',
        boxShadowSecondary: '0 4px 12px #00000026',
    };
    
    // 深色模式顏色
    const darkColors = {
        colorBgContainer: '#1f1f1f',
        colorBgElevated: '#1f1f1f',
        colorBgLayout: '#141414',
        colorBgSpotlight: '#262626',
        
        colorText: '#ffffff',
        colorTextSecondary: '#ffffff8c',
        colorTextDisabled: '#ffffff4d',
        
        colorBorder: '#424242',
        colorBorderSecondary: '#303030',
        
        boxShadow: '0 2px 8px #0000004d',
        boxShadowSecondary: '0 4px 12px #0000004d',
    };
    
    const colors = isDark ? darkColors : lightColors;
    
    // 使用 antd 預設算法
    const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;
    
    // 建立完整的 token（使用 antd 內建默认值 + 自訂顏色）
    const token: any = {
        colorPrimary: '#1890ff',
        colorPrimaryHover: '#40a9ff',
        colorPrimaryActive: '#096dd9',
        colorPrimaryBg: '#e6f7ff',
        colorPrimaryBgHover: '#bae7ff',
        
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        colorInfo: '#1890ff',
        
        ...colors,
        
        borderRadius: 6,
        borderRadiusLG: 8,
        borderRadiusSM: 4,
        
        fontSize: 14,
        fontSizeLG: 16,
        fontSizeSM: 12,
        
        padding: 16,
        paddingLG: 24,
        paddingSM: 12,
        margin: 16,
        marginLG: 24,
        marginSM: 12,
    };
    
    // 應用算法處理顏色
    const processedToken = algorithm(token);
    const tokens = tokensToCssVars(processedToken);
    
    return {
        config: {
            token: {
                colorPrimary: token.colorPrimary,
                borderRadius: token.borderRadius,
            },
            algorithm,
        },
        tokens,
    };
};

// 建立 Context
const ThemeContext = createContext<IThemeContext | undefined>(undefined);

/**
 * 主題 Provider 元件
 * Theme Provider component
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(false);
    const [antdTheme, setAntdTheme] = useState<ThemeConfig>({ token: { colorPrimary: '#1890ff' } });
    const [antdTokens, setAntdTokens] = useState<IAntdTokens>({
        colorPrimary: '#1890ff',
        colorPrimaryHover: '#40a9ff',
        colorPrimaryActive: '#096dd9',
        colorPrimaryBg: '#e6f7ff',
        colorPrimaryBgHover: '#bae7ff',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        colorInfo: '#1890ff',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#fafafa',
        colorBgSpotlight: '#f5f5f5',
        colorText: '#000000e0',
        colorTextSecondary: '#00000073',
        colorTextDisabled: '#0000003f',
        colorBorder: '#d9d9d9',
        colorBorderSecondary: '#f0f0f0',
        boxShadow: '0 2px 8px #00000026',
        boxShadowSecondary: '0 4px 12px #00000026',
        borderRadius: 6,
        borderRadiusLG: 8,
        borderRadiusSM: 4,
        fontSize: 14,
        fontSizeLG: 16,
        fontSizeSM: 12,
        padding: 16,
        paddingLG: 24,
        paddingSM: 12,
        margin: 16,
        marginLG: 24,
        marginSM: 12,
    });

    // 初始化主題配置
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        let initialDark = false;
        
        if (stored === 'dark') {
            initialDark = true;
        } else if (stored === 'light') {
            initialDark = false;
        } else {
            initialDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        setIsDark(initialDark);
        const { config, tokens } = createThemeConfig(initialDark);
        setAntdTheme(config);
        setAntdTokens(tokens);
    }, []);

    // 監聽系統主題變化
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const stored = localStorage.getItem('theme');
            if (!stored) {
                const newDark = e.matches;
                setIsDark(newDark);
                const { config, tokens } = createThemeConfig(newDark);
                setAntdTheme(config);
                setAntdTokens(tokens);
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
        
        const { config, tokens } = createThemeConfig(newTheme);
        setAntdTheme(config);
        setAntdTokens(tokens);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, antdTheme, antdTokens }}>
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