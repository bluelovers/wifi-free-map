import React, { ReactNode } from 'react';
import { Button, Card, Flex, Input, Select, Switch, Tag, Typography } from 'antd';
import { antdTokenToCSSVar, useAsCssVarForStyle } from '@/lib/utils/style/antd-css-var-utils';
import {
	LayoutOutlined,
	MenuFoldOutlined,
	SearchOutlined,
	ThunderboltOutlined,
	VerticalAlignBottomOutlined,
	WifiOutlined,
} from '@ant-design/icons';
import { IFilterState, ITagCategoryItem } from '@/types/map';
import { EnumListDisplayMode } from '@/lib/store/localStorage';
import {
	EnumGoogleMapsMode,
	getAvailableGoogleMapsModes,
	getGoogleMapsModeDisplayName,
} from '@/lib/utils/google-maps-url';
import { ColoredSelect } from '@/components/input/ColoredSelect';
import { setGoogleMapsMode as saveGoogleMapsMode } from '@/lib/store/google-maps-settings';

/**
 * 底部列表面板內容 / Bottom list panel content
 */
export const BottomListPanel = (props: {
	toggleListDisplayMode: () => void;
	children?: ReactNode;
}) => (
	<Flex
		vertical
		style={{
			height: 280,
			background: useAsCssVarForStyle(antdTokenToCSSVar('colorBgContainer')),
			borderTop: `1px solid ${useAsCssVarForStyle(antdTokenToCSSVar('colorBorderSecondary'))}`,
			overflow: 'hidden',
		}}
	>
		{/* 底部面板標題列 / Bottom panel header */}
		<Flex
			justify="space-between"
			align="center"
			style={{
				padding: '12px 16px',
				borderBottom: `1px solid ${useAsCssVarForStyle(antdTokenToCSSVar('colorBorderSecondary'))}`,
				background: useAsCssVarForStyle(antdTokenToCSSVar('colorBgElevated')),
			}}
		>
			<Typography.Title level={5} style={{ margin: 0 }}>
				附近設施點
			</Typography.Title>
			<Button
				type="text"
				icon={<LayoutOutlined />}
				onClick={props.toggleListDisplayMode}
				size="small"
				title="切換至側邊欄顯示列表"
			>
				切換至側邊欄
			</Button>
		</Flex>
		{/* 底部列表面板 / Bottom list */}
		<div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
			{props.children}
		</div>
	</Flex>
);

/**
 * 側邊欄搜尋與過濾面板內容 / Sidebar search and filter panel content
 * 提取到模組層級，避免每次渲染時重建
 * Extracted to module level to avoid recreation on each render
 */
export const SidebarContent = (props: {
	filters: IFilterState;
	setFilters: (filters: IFilterState) => void;
	facilityPoint: {
		categories: string[];
	};
	tagCategories: ITagCategoryItem[];
	effectiveListDisplayMode: EnumListDisplayMode;
	toggleListDisplayMode: () => void;
	setSidebarCollapsed: (collapsed: boolean) => void;
	longPressToMove: boolean;
	setLongPressToMove: (value: boolean) => void;
	mapMode: EnumGoogleMapsMode;
	setMapMode: (value: EnumGoogleMapsMode) => void;
	showBounds: boolean;
	setShowBounds: (value: boolean) => void;

	children?: ReactNode;
}) => (
	<Flex vertical gap="middle" style={{ padding: '12px', height: '100%', overflowY: 'auto' }}>
		{/* 側邊欄標題、切換按鈕與收合按鈕 / Sidebar header, toggle button and collapse button */}
		<Flex justify="space-between" align="center">
			<Typography.Title level={5} style={{ margin: 0 }}>
				搜尋與過濾
			</Typography.Title>
			<Flex gap="small">
				{/* 列表位置切換按鈕 / List position toggle button */}
				<Button
					type="text"
					icon={props.effectiveListDisplayMode === 'sidebar' ? <VerticalAlignBottomOutlined /> : <LayoutOutlined />}
					onClick={props.toggleListDisplayMode}
					size="small"
					title={props.effectiveListDisplayMode === 'sidebar' ? '切換至底部顯示列表' : '切換至側邊欄顯示列表'}
				/>
				<Button
					type="text"
					icon={<MenuFoldOutlined />}
					onClick={() => props.setSidebarCollapsed(true)}
					size="small"
					title="收合側邊欄"
				/>
			</Flex>
		</Flex>
		{/* 搜尋與過濾 / Search and Filter */}
		<Card size="small" hoverable title="搜尋與過濾">
			<Flex vertical gap="middle">
				<Input
					placeholder="搜尋熱點或 SSID..."
					prefix={<SearchOutlined />}
					value={props.filters.searchTerm}
					onChange={(e) => props.setFilters({ ...props.filters, searchTerm: e.target.value })}
				/>
				{/* 分類多選 / Category multi-select */}
				{props.facilityPoint.categories && props.facilityPoint.categories.length > 0 && (
					<Flex vertical gap="small">
						<Typography.Text type="secondary">依分類過濾 / Filter by Category</Typography.Text>
						<ColoredSelect
							placeholder="選擇分類..."
							onChange={(values) => props.setFilters({ ...props.filters, selectedCategories: values })}
							style={{ width: '100%' }}
							value={props.filters.selectedCategories}
							options={props.tagCategories}
						/>
					</Flex>
				)}
				<Flex gap="middle" wrap>
					<Flex align="center" gap="small">
						<WifiOutlined style={{ color: '#1890ff' }} />
						<Typography.Text>WiFi</Typography.Text>
						<Switch
							checked={props.filters.wifi}
							onChange={(checked) => props.setFilters({ ...props.filters, wifi: checked })}
							size="small"
						/>
					</Flex>
					<Flex align="center" gap="small">
						<ThunderboltOutlined style={{ color: '#fa8c16' }} />
						<Typography.Text>充電</Typography.Text>
						<Switch
							checked={props.filters.charging}
							onChange={(checked) => props.setFilters({ ...props.filters, charging: checked })}
							size="small"
						/>
					</Flex>
					<Flex align="center" gap="small">
						<Typography.Text>只顯示有密碼</Typography.Text>
						<Switch
							checked={props.filters.passwordOnly}
							onChange={(checked) => props.setFilters({ ...props.filters, passwordOnly: checked })}
							size="small"
						/>
					</Flex>
				</Flex>
			</Flex>
		</Card>

		{/* 其他選項 / Other Options */}
		<Card size="small" hoverable title="其他選項">
			<Flex gap="middle" wrap>
				<Flex align="center" gap="small">
					<Switch
						checked={props.longPressToMove}
						onChange={(checked) => props.setLongPressToMove(checked)}
						size="small"
					/>
					<Typography.Text>右鍵點擊移動定位點</Typography.Text>
				</Flex>
				<Flex align="center" gap="small">
					<Typography.Text>Google 地圖：</Typography.Text>
					<Select
						value={props.mapMode}
						onChange={(value) =>
						{
							props.setMapMode(value);
							saveGoogleMapsMode(value); // 儲存到 localStorage
						}}
						style={{ width: 140 }}
						size="small"
						options={getAvailableGoogleMapsModes().map(mode => ({
							value: mode,
							label: getGoogleMapsModeDisplayName(mode),
						}))}
					/>
				</Flex>
				<Flex align="center" gap="small">
					<Switch
						checked={props.showBounds}
						onChange={(checked) => props.setShowBounds(checked)}
						size="small"
					/>
					<Typography.Text>顯示範圍框線</Typography.Text>
				</Flex>
			</Flex>
		</Card>

		{/* 類別標籤 / Category tags */}
		<Flex gap="small" align="center" wrap>
			{props.tagCategories.map((category, idx) =>
			{
				return (
					<Tag
						key={category.value}
						color={category.color}
						variant={'solid'}
						style={{
							color: category.colorPreset.text10.toRgbString(),
							opacity: category.visible ? 1 : 0.3,
							fontWeight: 'bold',
						}}
					>
						{category.label ?? category.value}
					</Tag>
				)
			})}
		</Flex>

		{/* 設施點列表（僅在側邊欄模式下顯示）/ Facility point list (only in sidebar mode) */}
		{props.effectiveListDisplayMode === 'sidebar' && (
			props.children
		)}
	</Flex>
);
