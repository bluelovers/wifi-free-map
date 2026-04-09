# 主題系統重構 - 使用 antd Design Tokens

## 概述

將主題變數從手動定義改為使用 antd Design Tokens 動態生成，讓 antd algorithm 自動計算顏色。

**所有顏色統一來自 antd Design Tokens，ThemeProvider 不再定義任何顏色。**

## 修改檔案

- `src/components/ThemeProvider.tsx` - 主題 Provider，僅提供 seed token
- `src/app/ClientLayout.tsx` - 注入 CSS 變數到 document
- `src/styles/_variables.scss` - SCSS 備用變數
- `src/app/globals.scss` - 全域樣式

## 實作方式

### 1. ThemeProvider.tsx

只提供 `colorPrimary` 作為 seed token，其餘顏色由 antd algorithm 自動計算：

```typescript
// 只設定 seed token - 其餘顏色由 algorithm 計算
const seedToken: any = {
    colorPrimary: '#1890ff',  // 天藍色 (Sky Blue) - 主色調
    borderRadius: 6,
};

const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

// 應用 algorithm 處理顏色 - 自動生成所有 Design Token
const processedToken = algorithm(seedToken);
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

## 完整顏色對照表 (並排比較)

### 深色模式 (Dark Mode) - antd algorithm 計算

| SCSS 變數 | CSS 變數 | 色碼值 | 顏色說明 |
|-----------|----------|--------|----------|
| `--bg-primary` | `--color-bg-layout` | #000000 | 黑色 (Black) |
| `--bg-secondary` | `--color-bg-spotlight` | #262626 | 深灰色 (Dark Gray) |
| `--bg-elevated` | `--color-bg-elevated` | #1f1f1f | 深灰色 (Dark Gray) |
| `--bg-container` | `--color-bg-container` | #141414 | 深灰黑色 (Darker Gray) |
| `--text-primary` | `--color-text` | rgba(255,255,255,0.85) | 白色 (White) |
| `--text-secondary` | `--color-text-secondary` | rgba(255,255,255,0.65) | 淺灰色 (Light Gray) |
| `--text-disabled` | `--color-text-disabled` | rgba(255,255,255,0.25) | 淡白色 (Light White) |
| `--border-color` | `--color-border` | #424242 | 灰色 (Gray) |
| `--color-primary` | `--color-primary` | #177ddc | 深藍色 (Dark Blue) |
| `--color-success` | `--color-success` | #49aa19 | 綠色 (Green) |
| `--color-warning` | `--color-warning` | #d89614 | 橙色 (Orange) |
| `--color-error` | `--color-error` | #dc4446 | 紅色 (Red) |
| `--color-info` | `--color-info` | #1668dc | 藍色 (Blue) |
| `--box-shadow` | `--box-shadow` | 0 6px 16px... | 深色陰影 |
| `--border-radius` | `--border-radius` | 6 | 圓角 6px |

### 淺色模式 (Light Mode) - antd algorithm 計算

| SCSS 變數 | CSS 變數 | 色碼值 | 顏色說明 |
|-----------|----------|--------|----------|
| `--bg-primary` | `--color-bg-layout` | #f5f5f5 | 淡灰色 (Light Gray) |
| `--bg-secondary` | `--color-bg-spotlight` | #f5f5f5 | 淡灰色 (Light Gray) |
| `--bg-elevated` | `--color-bg-elevated` | #ffffff | 白色 (White) |
| `--bg-container` | `--color-bg-container` | #ffffff | 白色 (White) |
| `--text-primary` | `--color-text` | rgba(0,0,0,0.88) | 近黑色 (Near Black) |
| `--text-secondary` | `--color-text-secondary` | rgba(0,0,0,0.65) | 深灰色 (Dark Gray) |
| `--text-disabled` | `--color-text-disabled` | rgba(0,0,0,0.25) | 淺灰色 (Light Gray) |
| `--border-color` | `--color-border` | #d9d9d9 | 中灰色 (Medium Gray) |
| `--color-primary` | `--color-primary` | #1890ff | 天藍色 (Sky Blue) |
| `--color-success` | `--color-success` | #52c41a | 綠色 (Green) |
| `--color-warning` | `--color-warning` | #faad14 | 橙色 (Orange) |
| `--color-error` | `--color-error` | #ff4d4f | 紅色 (Red) |
| `--color-info` | `--color-info` | #1677ff | 藍色 (Blue) |
| `--box-shadow` | `--box-shadow` | 0 6px 16px... | 淺色陰影 |
| `--border-radius` | `--border-radius` | 6 | 圓角 6px |

### 完整 antd CSS 變數列表 (共 531 個)

以下是 antd 深色模式產生的所有 CSS 變數：

```
--blue: #1677FF
--purple: #722ED1
--cyan: #13C2C2
--green: #52C41A
--magenta: #EB2F96
--pink: #EB2F96
--red: #F5222D
--orange: #FA8C16
--yellow: #FADB14
--volcano: #FA541C
--geekblue: #2F54EB
--gold: #FAAD14
--lime: #A0D911

--color-primary: #177ddc
--color-success: #49aa19
--color-warning: #d89614
--color-error: #dc4446
--color-info: #1668dc
--color-link: #1668dc

--color-text-base: #fff
--color-bg-base: #000

--color-text: rgba(255,255,255,0.85)
--color-text-secondary: rgba(255,255,255,0.65)
--color-text-tertiary: rgba(255,255,255,0.45)
--color-text-quaternary: rgba(255,255,255,0.25)

--color-fill: rgba(255,255,255,0.18)
--color-fill-secondary: rgba(255,255,255,0.12)
--color-fill-tertiary: rgba(255,255,255,0.08)

--color-bg-layout: #000000
--color-bg-container: #141414
--color-bg-elevated: #1f1f1f
--color-bg-spotlight: #424242

--color-border: #424242
--color-border-secondary: #303030

--border-radius: 6
--control-height: 32
--font-size: 14

--box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08)...
```

---

## 顏色色碼說明

### 常用顏色名稱對照

| 色碼 | 顏色名稱 | 視覺描述 |
|------|----------|----------|
| #000000 | 黑色 (Black) | 最深色，用於深色模式主要背景 |
| #000000e0 | 近黑色 (Near Black) | 98% 黑色的半透明色，常用於主要文字 |
| #141414 | 深灰黑色 (Darker Gray) | 深色模式容器背景 |
| #1f1f1f | 深灰色 (Dark Gray) | 深色模式浮起元素 |
| #262626 | 深灰色 (Dark Gray) | 深色模式次要背景 |
| #424242 | 灰色 (Gray) | 深色模式邊框 |
| #f5f5f5 | 淡灰色 (Light Gray) | 淺色模式主要背景 |
| #fafafa | 灰白色 (Off White) | 淺色模式背景 |
| #ffffff | 白色 (White) | 最淺色，用於浮起元素 |
| #d9d9d9 | 中灰色 (Medium Gray) | 淺色模式邊框 |
| #1890ff | 天藍色 (Sky Blue) | antd 預設主色調 |
| #177ddc | 深藍色 (Dark Blue) | 深色模式主色調 |
| rgba(0,0,0,0.15) | 淡黑色 (Light Black) | 淺色模式陰影 |
| rgba(0,0,0,0.25) | 淺黑色 (Lighter Black) | 淺色模式禁用文字 |
| rgba(0,0,0,0.45) | 中黑色 (Medium Black) | 淺色模式次要文字 |
| rgba(0,0,0,0.65) | 深黑色 (Darker Black) | 淺色模式輔助文字 |
| rgba(0,0,0,0.88) | 近黑色 (Near Black) | 淺色模式主要文字 |
| rgba(0, 0, 0, 0.3) | 深黑色 (Dark Black) | 深色模式陰影 |
| rgba(255,255,255,0.25) | 淡白色 (Light White) | 深色模式禁用文字 |
| rgba(255,255,255,0.65) | 淺灰色 (Light Gray) | 深色模式次要文字 |
| rgba(255,255,255,0.85) | 白色 (White) | 深色模式主要文字 |

### 透明度表示法

- `rgba(R, G, B, 0.xx)` - xx 越小越透明
- `#000000e0` - hex 加上 alpha (e0 = 88% 不透明)

---

## 自訂顏色方式

如需覆蓋 antd 計算的顏色，可在 `createThemeConfig` 中修改 seed token：

```typescript
const seedToken: any = {
    colorPrimary: '#FF5733',  // 修改為自訂主色調 (例如: 橘紅色)
    borderRadius: 8,          // 修改圓角大小
};
```

---

## 測試紀錄

- ✅ 所有顏色統一來自 antd Design Tokens
- ✅ ThemeProvider 不再定義任何顏色
- ✅ 主題切換功能正常運作
- ✅ 淺色模式顏色正確套用
- ✅ 深色模式顏色正確套用
- ✅ CSS 變數正確注入到 document
- ✅ antd ConfigProvider 主題正確套用