import L, { DivIcon } from 'leaflet';

const outerRadius = 25; // 對應原本 radius={25}
const innerRadius = 10; // 對應原本 radius={10}
const svgSize = outerRadius * 2 + 5; // 給一點緩衝空間 (e.g., 55)
const centerPoint = svgSize / 2;     // 中心點 (e.g., 27.5)

export interface ISvgGpsPulseProps
{
	color?: string;
	fillColor?: string;
	fillOpacity?: number;
}

export function createSvgGpsPulse(props: ISvgGpsPulseProps)
{
	// 1. 定義顏色和尺寸 (對應你提供的 radius 10 和 25)
	const color = props.color || props.fillColor || '#1890ff';
	const fillColor = props.fillColor || props.color || color;

	// 2. 製作 SVG 字串
	// 注意：我們將原本的 className="gps-pulse" 加在 SVG 容器上，方便你做 CSS 動畫
	const mySvgIconHtml = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" class="gps-pulse-container" xmlns="http://www.w3.org/2000/svg">
	{/* className 加在 g 上 */}
	<g class="gps-pulse">
		<!-- 使用者位置 - 藍色半透明圓圈 -->
		<circle
			cx="${centerPoint}"
			cy="${centerPoint}"
			r="${outerRadius}"
			fill="${fillColor}"
			fill-opacity="0.3"
			stroke="${color}"
			stroke-width="1"
		/>
		</g>
		<!-- 内圈 - 中心實心圓 -->
		<circle
			cx="${centerPoint}"
			cy="${centerPoint}"
			r="${innerRadius}"
			fill="${fillColor}"
			fill-opacity="${props.fillOpacity ?? 0.7}"
			stroke="${color}"
			stroke-width="2"
		/>

	</svg>`;

	return mySvgIconHtml
}

export function createGpsPulseDivIcon(props: ISvgGpsPulseProps)
{
	return new DivIcon({
		html: createSvgGpsPulse(props),
		className: '',
		iconSize: [svgSize, svgSize],
		iconAnchor: [centerPoint, centerPoint],
	});
}

const customGpsIcon1 = new DivIcon({
	html: '<div style="width: 20px; height: 20px; background-color: #1890ff; border-radius: 50%;"></div>',
	className: 'custom-marker',
	iconSize: [20, 20],
	iconAnchor: [10, 10],
});
