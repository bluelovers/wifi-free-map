/**
 * 側邊欄展開寬度（像素）
 * Sidebar expanded width in pixels
 */
export const SIDER_WIDTH = 320;

/**
 * 篩選器狀態介面
 * Filter state interface
 */
export interface IFilterState
{
	wifi: boolean;
	charging: boolean;
	passwordOnly: boolean;
	searchTerm: string;
	selectedCategories: string[];
}

/**
 * 類別標籤項目介面
 * Tag category item interface
 */
export interface ITagCategoryItem
{
	value: string;
	label: string;
	color: string;
	colorPreset: {
		text10: {
			toRgbString(): string;
		};
	};
	visible: boolean | null;
}
