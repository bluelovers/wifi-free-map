import { NOMINATIM_CONTACT_EMAIL } from '@/config/nominatim-config';

export function handleDefaultFetchOptions(init?: RequestInit)
{
	init ??= {};
	return {
		...init,
		headers: {
			'User-Agent': `WiFi-Free-Map/1.0 (${NOMINATIM_CONTACT_EMAIL})`,
			...init.headers,
		},
	};
}

export const fetcher = async <T>(...args: Parameters<typeof fetch>) =>
{
	if (args[1] || typeof args[0] === 'string')
	{
		args[1] = handleDefaultFetchOptions(args[1]);
	}

	const res = await fetch(...args);
	if (!res.ok) throw new Error('Network response was not ok');
	return res.json() as Promise<T>;
};

export function buildFetcher<T, R = T>(baseFetcher: typeof fetcher, opts: {
	onSuccess(data: T): R
})
{
	return (...args: Parameters<typeof fetch>) => baseFetcher<T>(...args).then(opts.onSuccess);
}
