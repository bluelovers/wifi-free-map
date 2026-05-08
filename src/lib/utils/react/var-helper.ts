import { useCallback, useRef } from 'react';

/**
 * @title 靜態狀態 Hook (useRefState)
 * @description 建立一個行為類似 useState 但不會觸發重新渲染的狀態。
 *
 * ### 核心特性：
 * 1. **即時性**：更新後 `current` 立即改變，不像 `useState` 需要等到下一次渲染。
 * 2. **無副作用**：修改值時不會導致組件重新執行 (No Re-render)。
 * 3. **函數式更新**：支援 `setState(prev => prev + 1)` 語法，確保邏輯一致性。
 *
 * ### 適用場景：
 * - 儲存計時器 ID (Timer IDs)
 * - 紀錄上一次的 Props 或位置 (Prev States)
 * - 頻繁變動但不影響 UI 顯示的資料（如滾動位置、動畫座標）
 *
 * @param initialState 初始值
 * @returns [refObject, setRefState]
 */
export function useRefState<T>(initialState: T | (() => T))
{
	/** 初始化 ref，支援 lazy initialization 語法 */
	const ref = useRef<T>(
		typeof initialState === 'function'
			? (initialState as () => T)()
			: initialState,
	);

	/**
	 * 更新 ref 的值
	 * @param value 新的值或更新函數
	 */
	const setRefState = useCallback((value: T | ((prev: T) => T)) =>
	{
		if (typeof value === 'function')
		{
			ref.current = (value as (prev: T) => T)(ref.current);
		}
		else
		{
			ref.current = value;
		}
	}, []);

	return [ref, setRefState] as const;
}
