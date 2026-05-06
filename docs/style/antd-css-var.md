以下是加上 Ant Design CSS Variable 名稱的完整對照表。CSS 變數名稱由 `token2CSSVar` 函式將 camelCase 轉為 kebab-case 並加上 `--ant-` 前綴產生 [[1]](https://github.com/ant-design/cssinjs/blob/116099459d6fc8b3c4affb051ccdf3e7b5ceaacf/src/util/css-variables.ts#L4-L10)。

### 基礎色彩

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-editor-background` | `colorBgContainer` | `--ant-color-bg-container` | 主容器背景 |
| `--vscode-editor-foreground` | `colorText` | `--ant-color-text` | 主文字色 |
| `--vscode-foreground` | `colorTextBase` | `--ant-color-text-base` | 基礎文字色 |
| `--vscode-descriptionForeground` | `colorTextDescription` | `--ant-color-text-description` | 描述文字 |
| `--vscode-focusBorder` | `colorPrimary` / `controlOutline` | `--ant-color-primary` / `--ant-control-outline` | 焦點框線 |

### 按鈕

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-button-background` | `colorPrimary` | `--ant-color-primary` | 主按鈕背景 |
| `--vscode-button-foreground` | `colorTextLightSolid` | `--ant-color-text-light-solid` | 主按鈕文字 |
| `--vscode-button-hoverBackground` | `colorPrimaryHover` | `--ant-color-primary-hover` | 主按鈕 hover |
| `--vscode-button-secondaryBackground` | `colorFillSecondary` | `--ant-color-fill-secondary` | 次要按鈕背景 |
| `--vscode-button-secondaryForeground` | `colorText` | `--ant-color-text` | 次要按鈕文字 |
| `--vscode-button-secondaryHoverBackground` | `controlItemBgHover` | `--ant-control-item-bg-hover` | 次要按鈕 hover |

### 輸入框

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-input-background` | `colorBgContainer` | `--ant-color-bg-container` | 輸入框背景 |
| `--vscode-input-foreground` | `colorText` | `--ant-color-text` | 輸入框文字 |
| `--vscode-input-border` | `colorBorder` | `--ant-color-border` | 輸入框邊框 |
| `--vscode-input-placeholderForeground` | `colorTextPlaceholder` | `--ant-color-text-placeholder` | 佔位文字 |
| `--vscode-inputOption-activeBorder` | `colorPrimary` | `--ant-color-primary` | 焦點邊框 |
| `--vscode-inputValidation-errorBackground` | `colorErrorBg` | `--ant-color-error-bg` | 錯誤背景 |
| `--vscode-inputValidation-errorBorder` | `colorErrorBorder` | `--ant-color-error-border` | 錯誤邊框 |
| `--vscode-inputValidation-warningBackground` | `colorWarningBg` | `--ant-color-warning-bg` | 警告背景 |
| `--vscode-inputValidation-warningBorder` | `colorWarningBorder` | `--ant-color-warning-border` | 警告邊框 |

### 下拉選單 / 彈出層

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-dropdown-background` | `colorBgElevated` | `--ant-color-bg-elevated` | 浮層背景 |
| `--vscode-dropdown-foreground` | `colorText` | `--ant-color-text` | 浮層文字 |
| `--vscode-dropdown-border` | `colorBorderSecondary` | `--ant-color-border-secondary` | 浮層邊框 |

### 列表 / 選取

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-list-activeSelectionBackground` | `controlItemBgActive` | `--ant-control-item-bg-active` | 選中項目背景 |
| `--vscode-list-activeSelectionForeground` | `colorPrimary` | `--ant-color-primary` | 選中項目文字 |
| `--vscode-list-hoverBackground` | `controlItemBgHover` | `--ant-control-item-bg-hover` | hover 背景 |
| `--vscode-list-focusBackground` | `controlItemBgActive` | `--ant-control-item-bg-active` | 焦點背景 |
| `--vscode-editor-selectionBackground` | `colorPrimaryBg` | `--ant-color-primary-bg` | 文字選取背景 |

### 連結

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-textLink-foreground` | `colorLink` | `--ant-color-link` | 超連結 |
| `--vscode-textLink-activeForeground` | `colorLinkActive` | `--ant-color-link-active` | 點擊中的連結 |

### 狀態色

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-errorForeground` | `colorError` | `--ant-color-error` | 錯誤色 |
| `--vscode-warningForeground` | `colorWarning` | `--ant-color-warning` | 警告色 |
| `--vscode-infoForeground` | `colorInfo` | `--ant-color-info` | 資訊色 |
| `--vscode-progressBar-background` | `colorPrimary` | `--ant-color-primary` | 進度條 |

### 面板 / 佈局

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-panel-background` | `colorBgLayout` | `--ant-color-bg-layout` | 面板背景 |
| `--vscode-panel-border` | `colorBorder` | `--ant-color-border` | 面板邊框 |
| `--vscode-sideBar-background` | `colorBgLayout` | `--ant-color-bg-layout` | 側邊欄背景 |
| `--vscode-sideBarTitle-foreground` | `colorTextHeading` | `--ant-color-text-heading` | 標題文字 |

### 標籤 (Badge) / 通知

| VS Code CSS 變數 | Antd Token | Antd CSS Variable | 說明 |
|---|---|---|---|
| `--vscode-badge-background` | `colorPrimary` | `--ant-color-primary` | 徽章背景 |
| `--vscode-badge-foreground` | `colorTextLightSolid` | `--ant-color-text-light-solid` | 徽章文字 |
| `--vscode-notifications-background` | `colorBgElevated` | `--ant-color-bg-elevated` | 通知背景 |
| `--vscode-notifications-foreground` | `colorText` | `--ant-color-text` | 通知文字 |

***

### 額外常用衍生 Token

| Antd Token | Antd CSS Variable | 用途 |
|---|---|---|
| `colorTextSecondary` | `--ant-color-text-secondary` | 次要文字 |
| `colorTextTertiary` | `--ant-color-text-tertiary` | 第三級文字 |
| `colorTextQuaternary` | `--ant-color-text-quaternary` | 第四級文字 |
| `colorFill` | `--ant-color-fill` | 填充色 |
| `colorFillTertiary` | `--ant-color-fill-tertiary` | 第三級填充 |
| `colorFillQuaternary` | `--ant-color-fill-quaternary` | 第四級填充 |
| `colorSplit` | `--ant-color-split` | 分隔線色 |
| `colorIcon` | `--ant-color-icon` | 圖示色 |
| `colorIconHover` | `--ant-color-icon-hover` | 圖示 hover |
| `colorBorderDisabled` | `--ant-color-border-disabled` | 禁用邊框 |
| `controlItemBgActiveHover` | `--ant-control-item-bg-active-hover` | 選中項目 hover |
| `colorBgBase` | `--ant-color-bg-base` | 基礎背景色 |

**轉換規則**：camelCase token 名稱 → kebab-case，加上 `--ant-` 前綴 [[1]](https://github.com/ant-design/cssinjs/blob/116099459d6fc8b3c4affb051ccdf3e7b5ceaacf/src/util/css-variables.ts#L4-L10)。前綴可透過 `ConfigProvider` 的 `cssVar` 配置自訂。
