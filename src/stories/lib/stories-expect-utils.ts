import { expect } from 'storybook/test';

/**
 * 注意：如果是 antd 內建動畫，可能需要等待動畫結束
 */
export async function _expectNotInTheDocumentOrVisible(content: HTMLElement | null)
{
	if (content?.isConnected)
	{
		/**
		 * 如果只是 CSS 隱藏：
		 * 節點還在，檢查 CSS 狀態 (display: none / opacity: 0 / visibility: hidden)
		 * 注意：toBeVisible 會檢查寬高是否為 0，這對收合動畫很有效
		 */
		await expect(content).not.toBeVisible();
	}
	else
	{
		/**
		 * 如果是真正的 DOM 移除：
		 * 節點已消失
		 */
		await expect(content).not.toBeInTheDocument();
	}
}
