/**
 * GPS 脈衝 SVG 圖示元件
 * GPS pulse SVG icon component
 *
 * 自 svg.ts 的 createSvgGpsPulse() 切割為 React 元件
 * 無 Leaflet 依賴，可獨立展示在 Storybook 中
 * Extracted from createSvgGpsPulse() in svg.ts as a standalone React component
 * No Leaflet dependency — can be displayed in Storybook independently
 */
import React from 'react';

/** 外圈半徑 / Outer circle radius */
const OUTER_RADIUS = 25;
/** 內圈半徑 / Inner circle radius */
const INNER_RADIUS = 10;
/** SVG 尺寸 / SVG size */
const SVG_SIZE = OUTER_RADIUS * 2 + 5;
/** 中心點座標 / Center point coordinate */
const CENTER = SVG_SIZE / 2;

export interface IGpsPulseSvgProps
{
	/** 線條顏色 / Stroke color */
	color?: string;
	/** 填滿顏色 / Fill color */
	fillColor?: string;
	/** 內圈透明度 (0-1) / Inner circle opacity (0-1) */
	fillOpacity?: number;
	/** SVG 寬度 / SVG width */
	width?: number | string;
	/** SVG 高度 / SVG height */
	height?: number | string;
}

/**
 * GPS 脈衝 SVG 圖示
 * GPS pulse SVG icon
 *
 * 顯示用於定位的藍色脈衝動畫圓圈
 * Displays a blue pulsing circle animation for geolocation
 */
export function GpsPulseSvg(props: IGpsPulseSvgProps)
{
	const color = props.color || props.fillColor || '#1890ff';
	const fillColor = props.fillColor || props.color || color;

	return (
		<svg
			width={props.width ?? SVG_SIZE}
			height={props.height ?? SVG_SIZE}
			viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
			className="gps-pulse-container"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g className="gps-pulse">
				<circle
					cx={CENTER}
					cy={CENTER}
					r={OUTER_RADIUS}
					fill={fillColor}
					fillOpacity="0.3"
					stroke={color}
					strokeWidth="1"
				/>
			</g>
			<circle
				cx={CENTER}
				cy={CENTER}
				r={INNER_RADIUS}
				fill={fillColor}
				fillOpacity={props.fillOpacity ?? 0.7}
				stroke={color}
				strokeWidth="2"
			/>
		</svg>
	);
}
