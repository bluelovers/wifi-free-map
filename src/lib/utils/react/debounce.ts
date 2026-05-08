import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 一般輸入/搜尋
 */
export const useDebounce = <V>(value: V, wait: number) =>
{
	const [debounceValue, setDebounceValue] = useState(value)

	useEffect(() =>
	{
		const timer = setTimeout(() => setDebounceValue(value), wait)
		return () => clearTimeout(timer)
	}, [value, wait])

	return debounceValue
}

/**
 * 視窗縮放/按鈕防連點
 */
export const useThrottle = <V>(value: V, wait: number) =>
{
	const [throttledValue, setThrottledValue] = useState<V>(value);
	const lastUpdated = useRef<number>(0);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() =>
	{
		const now = Date.now();
		const remaining = wait - (now - lastUpdated.current);

		const update = () =>
		{
			lastUpdated.current = Date.now();
			setThrottledValue(value);
			if (timeoutRef.current)
			{
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};

		/** 情況 A：已經超過冷卻時間，立即更新 */
		if (remaining <= 0)
		{
			update();
		}
		/** 情況 B：還在冷卻中，但確保最後一次變更會在冷卻結束後執行 */
		else if (!timeoutRef.current)
		{
			timeoutRef.current = setTimeout(update, remaining);
		}

		return () =>
		{
			if (timeoutRef.current)
			{
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [value, wait]);

	return throttledValue;
};

/**
 * @title 防抖函數 Hook (useDebounceFn)
 * @description 確保在指定的時間間隔內，無論觸發多少次，函數只會在最後一次觸發後的延遲時間結束時執行。
 *
 * 這個版本使用了 useRef 來保護你的函數，確保在延遲結束執行時，呼叫的是最新的邏輯，同時不會觸發額外的 useEffect
 *
 * ### 優化重點：
 * 1. **避免閉包陷阱**：使用 `useRef` 儲存 `fn`，確保執行時永遠存取到最新的 State/Props。
 * 2. **穩定引用**：返回的 `run` 函數引用穩定，不會導致子組件不必要的重新渲染。
 * 3. **自動清理**：組件卸載時會自動清除計時器，防止記憶體洩漏或非預期回調。
 *
 * @param fn 要執行的目標函數
 * @param wait 延遲毫秒數
 * @returns { run: Function, cancel: Function } 包含執行與取消控制的物件
 */
export const useDebounceFn = <T extends (...args: any[]) => any>(fn: T, wait: number) =>
{
	/** 使用 useRef 儲存最新的函數，避免閉包陷阱 */
	const fnRef = useRef(fn);
	useEffect(() =>
	{
		fnRef.current = fn;
	}, [fn]);

	const timer = useRef<NodeJS.Timeout | null>(null);

	/** 清除計時器的函數 */
	const cancel = useCallback(() =>
	{
		if (timer.current)
		{
			clearTimeout(timer.current);
		}
	}, []);

	/** 封裝後的執行函數 */
	const run = useCallback((...args: Parameters<T>) =>
	{
		cancel();
		timer.current = setTimeout(() =>
		{
			fnRef.current(...args);
		}, wait);
	}, [wait, cancel]);

	/** 組件卸載時自動清除 */
	useEffect(() => cancel, [cancel]);

	return { run, cancel };
};

/**
 * @title 節流函數 Hook (useThrottleFn)
 * @description 確保在指定的時間間隔內，函數最多只會執行一次。
 *
 * 函數版的節流最重要的是確保第一次點擊立即執行（Leading）以及最後一次點擊後會補執行（Trailing）。
 *
 * ### 優化重點：
 * 1. **領先邊界 (Leading Edge)**：間隔開始時立即執行第一次觸發。
 * 2. **結尾補償 (Trailing Edge)**：確保在間隔期間內的最後一次操作，會在冷卻結束後被補執行。
 * 3. **精準計時**：動態計算 `remaining` 剩餘時間，比單純的 `setTimeout` 更精確地維持頻率。
 *
 * @param fn 要執行的目標函數
 * @param wait 節流頻率毫秒數
 * @returns { run: Function } 封裝後的執行函數
 */
export const useThrottleFn = <T extends (...args: any[]) => any>(fn: T, wait: number) =>
{
	const fnRef = useRef(fn);
	const lastExecuted = useRef<number>(0);
	const timer = useRef<NodeJS.Timeout | null>(null);

	useEffect(() =>
	{
		fnRef.current = fn;
	}, [fn]);

	const run = useCallback((...args: Parameters<T>) =>
	{
		const now = Date.now();
		const remaining = wait - (now - lastExecuted.current);

		const execute = () =>
		{
			lastExecuted.current = Date.now();
			fnRef.current(...args);
			if (timer.current)
			{
				clearTimeout(timer.current);
				timer.current = null;
			}
		};

		if (remaining <= 0)
		{
			/** 立即執行（Leading Edge） */
			execute();
		}
		else if (!timer.current)
		{
			/** 確保週期內最後一次動作會被執行（Trailing Edge） */
			timer.current = setTimeout(execute, remaining);
		}
	}, [wait]);

	return { run };
};
