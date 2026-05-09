/**
 * 浮動定位按鈕 Storybook Story
 * Floating geolocation button Storybook story
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Typography, Flex, ConfigProvider } from 'antd';
import { FloatGeolocationButton, IGeolocationResultWithMeta } from './FloatGeolocationButton';
import { PositionCoordDisplay } from '../PositionCoordDisplay';
import { useTheme } from '@/components/theme/ThemeProvider';
import { IGeoCoord } from '@/lib/utils/grid/grid-types';

/**
 * 互動式包裝元件
 * Interactive wrapper component
 *
 * 提供 position: relative 容器來限制 FloatButton 的絕對定位
 * Mock navigator.geolocation 以在 Storybook 中展示取得座標的流程
 * Provides a position:relative container to constrain the absolute-positioned FloatButton
 * Mocks navigator.geolocation to demonstrate coordinate retrieval in Storybook
 */
/**
 * 互動式包裝容器
 * Interactive wrapper container
 *
 * @param props.children - FloatGeolocationButton 實例 / FloatGeolocationButton instance
 * @param props.coords - 要顯示的座標（可選）/ Coordinates to display (optional)
 * @param props.error - 要顯示的錯誤訊息（可選）/ Error message to display (optional)
 */
function InteractiveFloatGeoWrapper(props: {
	/** FloatGeolocationButton 實例 / FloatGeolocationButton instance */
	children: ReactNode;
	/** 要顯示的座標（可選）/ Coordinates to display (optional) */
	coords?: IGeoCoord | null;
	/** 要顯示的錯誤訊息（可選）/ Error message to display (optional) */
	error?: string | null;
})
{
	/** 取得淺色主題配置以用於 ConfigProvider / Get light theme config for ConfigProvider */
	const { lightTheme } = useTheme();

	return (
		<Flex align="center">
			{/* 容器：限制 FloatButton 的絕對定位範圍 */}
			<Flex
				style={{
					position: 'relative',
					width: '100%',
					height: 200,
					minWidth: 400,
					border: '1px dashed #d9d9d9',
					borderRadius: 8,
					background: '#fafafa',
				}}
			>

				<Flex align="center" gap="middle" vertical justify="center" style={{ flex: 1 }}>

					<ConfigProvider theme={lightTheme.config}>

						{/* 座標顯示區 */}
						{props.coords && (
							<PositionCoordDisplay position={[props.coords.lat, props.coords.lng]} />
						)}
						{props.error && (
							<Typography.Text type="danger" style={{ fontSize: 14 }}>
								錯誤: {props.error}
							</Typography.Text>
						)}
						{!props.coords && !props.error && (
							<Typography.Text type="secondary" style={{ fontSize: 13 }}>
								點擊按鈕以取得模擬 GPS 座標
							</Typography.Text>
						)}

					</ConfigProvider>

				</Flex>

				{props.children}
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
		// InteractiveFloatGeoWrapper,
		// (Story) => (
		// 	<div style={{ width: 400, padding: 32 }}>
		// 		<Story />
		// 	</div>
		// ),

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
	render: (props) =>
	{

		/**
		 * 儲存從 Geolocation API 取得的座標
		 * Store coordinates received from Geolocation API
		 */
		const [coords, setCoords] = useState<IGeoCoord | null>(null);
		/** 儲存 Geolocation 錯誤訊息 / Store geolocation error message */
		const [error, setError] = useState<string | null>(null);

		/**
		 * 處理 Geolocation 回呼結果
		 * Handle geolocation callback result
		 *
		 * 成功時設定座標，失敗時設定錯誤訊息
		 * On success, set coordinates; on failure, set error message
		 */
		const onRequestGeolocation = useCallback((result: IGeolocationResultWithMeta) =>
		{
			console.log('onRequestGeolocation', result);

			if (result.error)
			{
				setError(result.error.message);
			}
			else if (result.coord)
			{
				setCoords(result.coord);
			}
		}, []);

		return (<InteractiveFloatGeoWrapper coords={coords} error={error}>
			<FloatGeolocationButton {...props} onRequestGeolocation={onRequestGeolocation} />
		</InteractiveFloatGeoWrapper>)
	},
};
