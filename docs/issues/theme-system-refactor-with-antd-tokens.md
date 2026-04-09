# 主題系統重構 - 使用 antd Design Tokens

## 概述

將主題變數從手動定義改為使用 antd Design Tokens 動態生成，讓 antd algorithm 自動計算顏色。

## 修改檔案

- `src/components/ThemeProvider.tsx` - 主題 Provider，包含 antd tokens 處理
- `src/app/ClientLayout.tsx` - 注入 CSS 變數到 document
- `src/styles/_variables.scss` - SCSS 備用變數
- `src/app/globals.scss` - 全域樣式

## 實作方式

### 1. ThemeProvider.tsx

只提供 `colorPrimary` 作為 seed token，其餘顏色由 antd algorithm 自動計算：

```typescript
const seedToken = {
    colorPrimary: '#1890ff',  // 主色調 (天藍色 Blue)
    borderRadius: 6,
};

const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

const config: ThemeConfig = {
    token: seedToken,
    algorithm,
};
```

### 2. tokensToCssVars 映射

將 antd token 名稱映射到 SCSS 自訂名稱：

| antd Token | SCSS 變數 |
|------------|-----------|
| colorBgLayout | bg-primary |
| colorBgSpotlight | bg-secondary |
| colorBgElevated | bg-elevated |
| colorBgContainer | bg-container |
| colorText | text-primary |
| colorTextSecondary | text-secondary |
| colorTextDisabled | text-disabled |
| colorBorder | border-color |
| colorPrimary | color-primary |

---

## 顏色對照表

### 淺色模式 (Light Mode)

| SCSS 變數 | antd Algorithm 計算值 | 顏色說明 |
|-----------|----------------------|----------|
| `--bg-primary` | #f5f5f5 | 淡灰色 (Light Gray) - 頁面背景 |
| `--bg-secondary` | #f5f5f5 | 淡灰色 (Light Gray) |
| `--bg-elevated` | #ffffff | 白色 (White) - 浮起元素背景 |
| `--bg-container` | #ffffff | 白色 (White) - 容器背景 |
| `--text-primary` | rgba(0,0,0,0.88) | 近黑色 (Near Black) - 主要文字 |
| `--text-secondary` | rgba(0,0,0,0.65) | 深灰色 (Dark Gray) - 次要文字 |
| `--text-disabled` | - | 淺灰色 (Light Gray) - 禁用文字 |
| `--border-color` | #d9d9d9 | 中灰色 (Medium Gray) - 邊框 |
| `--color-primary` | #1890ff | 天藍色 (Sky Blue) - 主要操作色 |

#### 被註解掉的淺色模式顏色 (已停用)

```scss
// 已註解 - 交由 antd algorithm 計算
// --bg-primary: #fafafa      (原本: 灰白色)
// --bg-secondary: #ffffff   (原本: 白色)
// --bg-elevated: #ffffff    (原本: 白色)
// --bg-container: #ffffff   (原本: 白色)
// --text-primary: #000000   (原本: 純黑色)
// --text-secondary: rgba(0, 0, 0, 0.45) (原本: 灰色)
// --text-disabled: rgba(0, 0, 0, 0.25) (原本: 淺灰色)
// --border-color: #d9d9d9   (原本: 中灰色)
// --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) (原本: 淡黑色陰影)
```

---

### 深色模式 (Dark Mode)

| SCSS 變數 | antd Algorithm 計算值 | 顏色說明 |
|-----------|----------------------|----------|
| `--bg-primary` | #000000 | 黑色 (Black) - 頁面背景 |
| `--bg-secondary` | #262626 | 深灰色 (Dark Gray) |
| `--bg-elevated` | #1f1f1f | 深灰色 (Dark Gray) - 浮起元素 |
| `--bg-container` | #141414 | 深灰黑色 (Darker Gray) - 容器 |
| `--text-primary` | rgba(255,255,255,0.85) | 白色 (White) - 主要文字 |
| `--text-secondary` | rgba(255,255,255,0.65) | 淺灰色 (Light Gray) - 次要文字 |
| `--text-disabled` | - | 灰色 (Gray) - 禁用文字 |
| `--border-color` | #424242 | 灰色 (Gray) - 邊框 |
| `--color-primary` | #177ddc | 深藍色 (Dark Blue) - 主要操作色 |

#### 被註解掉的深色模式顏色 (已停用)

```scss
// 已註解 - 交由 antd algorithm 計算
// --bg-primary: #141414      (原本: 深灰色)
// --bg-secondary: #1f1f1f    (原本: 深灰色)
// --bg-elevated: #1f1f1f     (原本: 深灰色)
// --bg-container: #1f1f1f    (原本: 深灰色)
// --text-primary: #ffffff    (原本: 白色)
// --text-secondary: rgba(255, 255, 255, 0.65) (原本: 淺白色)
// --text-disabled: rgba(255, 255, 255, 0.25) (原本: 淡白色)
// --border-color: #424242    (原本: 灰色)
// --color-primary: #177ddc   (原本: 深藍色)
// --shadow-color: rgba(0, 0, 0, 0.3) (原本: 深黑色陰影)
// --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) (原本: 深黑色陰影)
```

---

## 顏色色碼說明

### 常用顏色名稱對照

| 色碼 | 顏色名稱 | 視覺描述 |
|------|----------|----------|
| #000000 | 黑色 (Black) | 最深色，用於主要背景 |
| #000000e0 | 近黑色 (Near Black) | 98% 黑色的半透明色，常用於主要文字 |
| #141414 | 深灰黑色 (Darker Gray) | 深色模式容器背景 |
| #1f1f1f | 深灰色 (Dark Gray) | 深色模式浮起元素 |
| #262626 | 深灰色 (Dark Gray) | 深色模式次要背景 |
| #424242 | 灰色 (Gray) | 深色模式邊框 |
| #f5f5f5 | 淡灰色 (Light Gray) | 淺色模式主要背景 |
| #ffffff | 白色 (White) | 最淺色，用於浮起元素 |
| #d9d9d9 | 中灰色 (Medium Gray) | 淺色模式邊框 |
| #1890ff | 天藍色 (Sky Blue) | antd 預設主色調 |
| #177ddc | 深藍色 (Dark Blue) | 深色模式主色調 |
| rgba(0,0,0,0.15) | 淡黑色 (Light Black) | 淺色模式陰影 |
| rgba(0, 0, 0, 0.3) | 深黑色 (Dark Black) | 深色模式陰影 |
| rgba(255,255,255,0.85) | 白色 (White) | 深色模式主要文字 |
| rgba(255,255,255,0.65) | 淺灰色 (Light Gray) | 深色模式次要文字 |

### 透明度表示法

- `rgba(R, G, B, 0.xx)` - xx 越小越透明
- `#000000e0` - hex 加上 alpha (e0 = 88% 不透明)

---

## 自訂顏色方式

如需覆蓋 antd 計算的顏色，可在 `createThemeConfig` 中修改：

```typescript
const seedToken = {
    colorPrimary: '#FF5733',  // 修改為自訂主色調 (例如: 橘紅色)
    borderRadius: 8,          // 修改圓角大小
};

// 或使用 customOverrides 覆蓋特定顏色
const customOverrides = isDark ? {
    // 深色模式特定覆蓋
} : {
    // 淺色模式特定覆蓋
};
```

---

## 測試紀錄

- ✅ 主題切換功能正常運作
- ✅ 淺色模式顏色正確套用
- ✅ 深色模式顏色正確套用
- ✅ CSS 變數正確注入到 document
- ✅ antd ConfigProvider 主題正確套用