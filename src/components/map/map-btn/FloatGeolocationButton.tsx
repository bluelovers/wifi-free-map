import {
	IGeolocationResult,
	getGeolocationPosition,
	requestGeoPermissionsAndPosition,
	requestPermissionsGeolocation,
} from '@/lib/utils/api/browser-api';
import { wrapCoordinate, wrapCoordinateFromGeolocationCoordinates } from '@/lib/utils/geo/geo-transform';
import { IGeoCoord } from '@/lib/utils/grid/grid-types';
import { AimOutlined } from '@ant-design/icons';
import { Button, FloatButton } from 'antd';
import { FloatButtonElement } from 'antd/es/float-button/FloatButton';
import { MouseEvent, useEffect } from 'react';

export interface IGeolocationResultWithMeta extends IGeolocationResult
{
	type: 'auto' | 'click';
	error?: Error;
}

export interface IFloatGeolocationButtonProps
{
	// mapRef: React.RefObject<L.Map | null>;
	onClick?(result: IGeolocationResultWithMeta | {
		type: 'auto' | 'click';
		error: Error;
	}, event: MouseEvent<HTMLButtonElement>): void;

	autoRequestGeolocation?: boolean;

	onRequestGeolocation?(result: IGeolocationResultWithMeta): void;

	onError?(error: Error): void;

	title?: string;

	btnRef?: React.RefObject<FloatButtonElement | null>;
}

/**
 * 浮動置中按鈕（Google Maps 風格）
 * 取得 GPS 權限並嘗試獲取使用者位置
 *
 * @param {IFloatGeolocationButtonProps} props
 * @returns {React.JSX.Element}
 *
 * @constructor
 */
export function FloatGeolocationButton(props: IFloatGeolocationButtonProps)
{
	/** 取得 GPS 權限並嘗試獲取使用者位置（可重複呼叫） */
	const requestGeolocation = async (type: 'auto' | 'click') =>
	{
		return requestGeoPermissionsAndPosition()
			.then(result =>
			{
				console.log('Geolocation success, coord:', result.coord, result.geoApiPosition);

				result = {
					...result,
					type,
				} as IGeolocationResultWithMeta;

				props.onRequestGeolocation?.(result as IGeolocationResultWithMeta);

				return result;
			})
			.catch(error =>
			{
				console.error('Geolocation error:', error);
				props.onError?.(error);

				return {
					type,
					error,
				}
			}) as Promise<IGeolocationResultWithMeta>;
	};

	useEffect(() =>
	{
		if (props.autoRequestGeolocation)
		{
			requestGeolocation('auto');
		}
	}, [props.autoRequestGeolocation]);

	return (
		<FloatButton
			ref={props.btnRef}
			type="primary"
			shape="circle"
			icon={<AimOutlined />}
			onClick={(event) =>
			{
				requestGeolocation('click').then(result =>
				{
					props.onClick?.(result, event as any);
				});
			}}
			style={{
				position: 'absolute',
				// bottom: '30px',
				// right: '10px',
				// zIndex: 1000,
			}}
			tooltip={{
				title: props.title ?? '顯示你的位置',
				placement: 'top',
			}}
		/>
	)
}

