
/**
 * 列表顯示位置儲存鍵
 * LocalStorage key for list display position
 */
const LIST_DISPLAY_MODE_KEY = 'wifi-map-list-display-mode';

/**
 * 列表顯示模式類型
 * List display mode type
 */
export enum EnumListDisplayMode
{
	SIDEBAR = 'sidebar',
	BOTTOM = 'bottom',
}

/**
 * 從 localStorage 讀取列表顯示模式
 * Read list display mode from localStorage
 */
export const getStoredListDisplayMode = (): EnumListDisplayMode | null =>
{
	if (typeof window === 'undefined') return null;
	try
	{
		const stored = localStorage.getItem(LIST_DISPLAY_MODE_KEY);
		if (stored === EnumListDisplayMode.SIDEBAR || stored === EnumListDisplayMode.BOTTOM)
		{
			return stored as EnumListDisplayMode;
		}
		// 無效值，清除
		localStorage.removeItem(LIST_DISPLAY_MODE_KEY);
		return null;
	}
	catch
	{
		return null;
	}
};
/**
 * 儲存列表顯示模式至 localStorage
 * Save list display mode to localStorage
 */
export const setStoredListDisplayMode = (mode: EnumListDisplayMode): void =>
{
	if (typeof window === 'undefined') return;
	try
	{
		localStorage.setItem(LIST_DISPLAY_MODE_KEY, mode);
	}
	catch
	{
		// 忽略儲存錯誤
	}
};
