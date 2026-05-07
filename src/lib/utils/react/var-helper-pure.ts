
import { RefObject } from 'react';

export type IRefObjectMaybe<T> = T | RefObject<T>;

export function isRefObject<T>(val: IRefObjectMaybe<T>): val is RefObject<T>
{
	return val && typeof val === 'object' && 'current' in val;
}

export function unwrapRefObject<T>(val: IRefObjectMaybe<T>): T
{
	return isRefObject(val) ? val.current : val;
}
