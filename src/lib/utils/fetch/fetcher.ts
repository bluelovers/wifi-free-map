import { NOMINATIM_CONTACT_EMAIL } from '@/config/nominatim-config';

/**
 * 快取控制配置（7 天） / Cache control config (7 days)
 */
export const CACHE_MAX_AGE = 60 * 60 * 24 * 7;

export const CACHE_MAX_AGE_404 = 60 * 60 * 24 * 1; // 1 day

/**
 * 請求快取選項 / Request cache options
 */
export type IFetchCacheOptions =
	| 'default'
	| 'force-cache'
	| 'no-cache'
	| 'no-store'
	| 'only-if-cached'
	| 'reload';

/**
 * 擴展的請求初始化選項 / Extended request init options
 */
export interface IExtendedRequestInit extends RequestInit
{
	/** 快取策略 / Cache strategy */
	cache?: IFetchCacheOptions;
	/** 重新驗證時間（秒）/ Revalidation time in seconds */
	next?: {
		revalidate?: number | false;
		tags?: string[];
	};
}

export function handleDefaultFetchOptions(init?: IExtendedRequestInit)
{
	init ??= {};
	init.cache ??= 'force-cache';
	init.next ??= {};
	init.next.revalidate ??= CACHE_MAX_AGE; // 7 days

	return {
		...init,
		headers: {
			'User-Agent': `WiFi-Free-Map/1.0 (${NOMINATIM_CONTACT_EMAIL})`,
			...init.headers,
		},
	} as IExtendedRequestInit;
}

export const fetcher = async <T>(input: RequestInfo | URL, init?: IExtendedRequestInit) =>
{
	const options = handleDefaultFetchOptions(init);
	const res = await fetch(input, options);
	if (!res.ok) throw new Error('Network response was not ok');
	return res.json() as Promise<T>;
};

export function buildFetcher<T, R = T>(baseFetcher: typeof fetcher, opts: {
	onSuccess(data: T): R
})
{
	return (...args: Parameters<typeof fetch>) => baseFetcher<T>(...args).then(opts.onSuccess);
}
