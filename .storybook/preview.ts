import type { Preview } from "@storybook/nextjs-vite";
import { withTheme } from "../src/stories/decorators/withAntdTheme";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },

  /**
   * 主題切換工具列
   * Theme switching toolbar
   *
   * 在 Storybook 工具列加入主題下拉選單
   * 讓所有 Antd Theme story 可以在 Light / Dark / Empty 之間即時切換
   * Adds a theme dropdown to the Storybook toolbar
   * Lets all Antd Theme stories switch between Light / Dark / Empty on the fly
   */
  globalTypes: {
    theme: {
      name: "Theme",
      description: "切換 antd 主題 / Switch antd theme",
      defaultValue: "light",
      toolbar: {
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light", icon: "circlehollow" },
          { value: "dark", title: "Dark", icon: "circle" },
          { value: "empty", title: "Empty (default)", icon: "circle" },
        ],
      },
    },
  },

  /**
   * 全域主題裝飾器
   * Global theme decorator
   *
   * 自動為所有 story 加上 ConfigProvider 包裹，支援工具列即時切換 Light / Dark / Empty
   * 新建立的 story 無需手動加入 decorator 即可繼承此功能
   * Automatically wraps all stories with ConfigProvider for toolbar-based theme switching
   * New stories inherit this functionality without manually adding the decorator
   */
  decorators: [withTheme],
};

export default preview;
