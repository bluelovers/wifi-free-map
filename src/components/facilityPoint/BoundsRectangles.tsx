import React from 'react';
import { Rectangle } from 'react-leaflet';
import { ITSPartialPick } from 'ts-type';
import { IProvideMapLoadingStrategyByAnyCoord } from '@/lib/utils/grid/grid-utils-global';

/**
 * 設施點邊界框線組件
 * Facility point bounds rectangle component
 *
 * 在地圖上以框線繪製 facilityPointRangeBounds 與 facilityPointTriggerBounds
 */
interface IBoundsRectanglesProps extends ITSPartialPick<IProvideMapLoadingStrategyByAnyCoord, 'matchedRangeBounds' | 'triggerThresholdRangeBounds' | 'blockScanRangeBounds'>
{
	/** 是否顯示邊界框線（預設隱藏）/ Whether to show bounds rectangles (default: hidden) */
	visible?: boolean;
}

/**
 * 設施點邊界框線組件
 * Facility point bounds rectangle component
 */
export function BoundsRectangles(props: IBoundsRectanglesProps)
{
	/** 預設隱藏，只有當 visible 為 true 時才渲染 */
	if (!props.visible) return null;

	return (
		<>
			{/**
			 * 設施點範圍邊界框線（紅色）
			 * Facility point range bounds rectangle (red)
			 */}
			{props.matchedRangeBounds && (
				<Rectangle
					bounds={[
						[props.matchedRangeBounds.minLat, props.matchedRangeBounds.minLng],
						[props.matchedRangeBounds.maxLat, props.matchedRangeBounds.maxLng],
					]}
					pathOptions={{
						/** 紅色邊框 / Red border */
						color: '#ff0000',
						/** 邊框寬度 / Border width */
						weight: 2,
						/** 不填充 / No fill */
						fillOpacity: 0,
					}}
				/>
			)}

			{/**
			 * 設施點觸發邊界框線（藍色）
			 * Facility point trigger bounds rectangle (blue)
			 */}
			{props.triggerThresholdRangeBounds && (
				<Rectangle
					bounds={[
						[props.triggerThresholdRangeBounds.minLat, props.triggerThresholdRangeBounds.minLng],
						[props.triggerThresholdRangeBounds.maxLat, props.triggerThresholdRangeBounds.maxLng],
					]}
					pathOptions={{
						/** 藍色邊框 / Blue border */
						color: '#0000ff',
						/** 邊框寬度 / Border width */
						weight: 2,
						/** 不填充 / No fill */
						fillOpacity: 0,
					}}
				/>
			)}

			{props.blockScanRangeBounds && (
				<Rectangle
					bounds={[
						[props.blockScanRangeBounds.minLat, props.blockScanRangeBounds.minLng],
						[props.blockScanRangeBounds.maxLat, props.blockScanRangeBounds.maxLng],
					]}
					pathOptions={{
						/** 藍色邊框 / Blue border */
						color: '#5ddf0f',
						/** 邊框寬度 / Border width */
						weight: 2,
						/** 不填充 / No fill */
						fillOpacity: 0,
					}}
				/>
			)}
		</>
	);
}
