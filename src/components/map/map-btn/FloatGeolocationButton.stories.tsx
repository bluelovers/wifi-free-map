/**
 * 浮動定位按鈕 Storybook Story
 * Floating geolocation button Storybook story
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { useState, useEffect } from 'react';
import { Typography, Flex, ConfigProvider } from 'antd';
import { FloatGeolocationButton, IGeolocationResultWithMeta } from './FloatGeolocationButton';
import { PositionCoordDisplay } from '../PositionCoordDisplay';
import { useTheme } from '@/components/theme/ThemeProvider';

/**
 * 互動式包裝元件
 * Interactive wrapper component
 *
 * 提供 position: relative 容器來限制 FloatButton 的絕對定位
 * Mock navigator.geolocation 以在 Storybook 中展示取得座標的流程
 * Provides a position:relative container to constrain the absolute-positioned FloatButton
 * Mocks navigator.geolocation to demonstrate coordinate retrieval in Storybook
 */
function InteractiveFloatGeoWrapper()
{
	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() =>
	{
		/** Mock navigator.permissions.query 以回傳 granted */
		const origQuery = navigator.permissions?.query.bind(navigator.permissions);
		if (navigator.permissions)
		{
			(navigator.permissions as any).query = () => Promise.resolve({
				state: 'granted' as PermissionState,
				name: 'geolocation' as PermissionName,
			});
		}

		/** Mock navigator.geolocation.getCurrentPosition 以回傳模擬座標 */
		const origGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
		navigator.geolocation.getCurrentPosition = (
			success: PositionCallback,
			_error?: PositionErrorCallback | null,
			_options?: PositionOptions,
		) =>
		{
			success({
				coords: {
					latitude: 25.0478,
					longitude: 121.5170,
					accuracy: 50,
					altitude: null,
					altitudeAccuracy: null,
					heading: null,
					speed: null,
					toJSON: () => ({}),
				},
				timestamp: Date.now(),
				toJSON: () => ({}),
			} as GeolocationPosition);
		};

		return () =>
		{
			if (navigator.permissions && origQuery)
			{
				(navigator.permissions as any).query = origQuery;
			}
			navigator.geolocation.getCurrentPosition = origGetCurrentPosition;
		};
	}, []);

	const handleClick = (result: IGeolocationResultWithMeta | {
		type: 'auto' | 'click';
		error: Error;
	}, _event: any) =>
	{
		if ('coord' in result && result.coord)
		{
			setCoords({ lat: result.coord.lat, lng: result.coord.lng });
			setError(null);
		}
		else if ('error' in result && result.error)
		{
			setError(result.error.message);
		}
	};

	const { lightTheme } = useTheme();

	return (
		<Flex align="center">
			{/* 容器：限制 FloatButton 的絕對定位範圍 */}
			<Flex
				style={{
					position: 'relative',
					width: '100%',
					height: 200,
					border: '1px dashed #d9d9d9',
					borderRadius: 8,
					background: '#fafafa',
				}}
			>

				<Flex align="center" gap="middle" vertical justify='center' style={{ flex: 1 }}>

					<ConfigProvider theme={lightTheme.config}>

					{/* 座標顯示區 */}
					{coords && (
						<PositionCoordDisplay position={[coords.lat, coords.lng]} />
					)}
					{error && (
						<Typography.Text type="danger" style={{ fontSize: 14 }}>
							錯誤: {error}
						</Typography.Text>
					)}
					{!coords && !error && (
						<Typography.Text type="secondary" style={{ fontSize: 13 }}>
							點擊按鈕以取得模擬 GPS 座標
						</Typography.Text>
					)}

					</ConfigProvider>

				</Flex>

				<FloatGeolocationButton onClick={handleClick} />
			</Flex>


		</Flex>
	);
}

const meta = {
	/**
	 * 浮動定位按鈕
	 * Floating geolocation button
	 *
	 * 使用 antd FloatButton 的定位按鈕，點擊時嘗試取得瀏覽器 GPS 位置
	 * Story 內 mock navigator.geolocation，點擊後會顯示取得的模擬座標
	 * 可透過 Actions panel 觀察 onClick / onError 等事件
	 *
	 * Click-triggered geolocation via antd FloatButton
	 * navigator.geolocation is mocked in the story to show coordinates on screen
	 */
	title: 'Components/FloatGeolocationButton',
	component: FloatGeolocationButton,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	args: {
		onClick: fn(),
		onRequestGeolocation: fn(),
		onError: fn(),
	},
	decorators: [
		(Story) => (
			<div style={{ width: 400, padding: 32 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof FloatGeolocationButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 預設互動狀態
 * Default interactive state
 *
 * 按鈕被限制在虛線容器內（position: relative）
 * 點擊後 mock geolocation 回傳台北車站附近座標（25.0478, 121.5170）
 * 座標即時顯示在容器下方
 *
 * Button constrained inside a dashed container (position: relative)
 * Click triggers mocked geolocation that returns coords near Taipei Main Station
 * Coordinates appear below the container in real-time
 */
export const Default: Story = {
	render: () => <InteractiveFloatGeoWrapper />,
};
