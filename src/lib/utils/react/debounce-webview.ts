/**
 * Created by user on 2026/5/8.
 */

import { useEffect, useRef, useState } from 'react';

/**
 * 針對 UI 渲染優化的極簡 Throttle
 *
 * 捲動/動畫同步
 */
export const useThrottleAnimationFrame = <V>(value: V) =>
{
	const [throttledValue, setThrottledValue] = useState(value);
	const rafRef = useRef<number>(0);

	useEffect(() =>
	{
		if (rafRef.current) return;

		rafRef.current = requestAnimationFrame(() =>
		{
			setThrottledValue(value);
			rafRef.current = 0;
		});

		return () => cancelAnimationFrame(rafRef.current);
	}, [value]);

	return throttledValue;
};
