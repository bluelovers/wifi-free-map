/**
 * 複製密碼
 *
 * @param text 密碼文字
 */
export async function copyPassword(text: string): Promise<void>
{
	try
	{
		await navigator.clipboard.writeText(text);
		alert('已複製 / Copied!');
	}
	catch
	{
		alert('複製失敗 / Copy failed');
	}
}

export function requestPermissionsGeolocation(): Promise<PermissionStatus | undefined>
{
	return new Promise(async (resolve, reject) =>
	{
		try
		{
			if (navigator.permissions?.query)
			{
				await navigator.permissions
					.query({ name: 'geolocation' as PermissionName })
					.then((result) =>
					{
						if (result.state === 'denied')
						{
							reject(new Error('Geolocation denied'));
							return;
						}
						console.log('取得定位權限或位置', result);
						resolve(result);
					})
					.catch(() =>
					{
						resolve(undefined);
					})
				;
			}
			else
			{
				resolve(undefined);
			}
		}
		catch (e)
		{
			console.error('取得定位權限或位置時發生錯誤', e);
			reject(e);
		}
	});
}

export function _getGeolocationPositionCore(resolve: (position: GeolocationPosition) => void, reject: (error: GeolocationPositionError) => void)
{
	navigator.geolocation.getCurrentPosition(resolve, reject);
}

export function getGeolocationPosition(): Promise<GeolocationPosition>
{
	return new Promise(_getGeolocationPositionCore);
}
