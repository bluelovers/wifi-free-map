import React, { ReactNode, useState } from 'react';
import { Button, Card } from 'antd';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import type { CardProps } from 'antd';

/**
 * 可摺疊 Card 元件參數介面
 * Collapsible Card component props interface
 */
export interface ICollapsibleCardProps extends Omit<CardProps, 'title' | 'children' | 'extra'> {
	/** Card 標題 / Card title */
	title: ReactNode;
	/** Card 內容 / Card content */
	children: ReactNode;
	/** 是否啟用摺疊功能（預設 true）。設為 false 時等同於一般 Card / Whether collapsible (default true). When false, behaves as a plain Card */
	collapsible?: boolean;
	/** 預設是否摺疊（僅 collapsible=true 有效，預設 false）/ Whether collapsed by default (only when collapsible=true, default false) */
	defaultCollapsed?: boolean;
	/** 收合按鈕右側的自訂 extra（可選）/ Custom extra after the collapse toggle (optional) */
	extra?: ReactNode;
	/** 收合按鈕左側的自訂 extra（可選）/ Custom extra before the collapse toggle (optional) */
	extraOnLeft?: ReactNode;
	/** 是否隱藏預設摺疊按鈕（僅 collapsible=true 有效，完全自訂 extra 時使用）/ Whether to hide the default collapse toggle (only when collapsible=true, for fully custom extra) */
	hideDefaultToggle?: boolean;

	/** 自訂摺疊按鈕圖標（[展開圖標, 收合圖標]）/ Custom collapse toggle icons ([expand icon, collapse icon]) */
	collapsibleIcons?: [collapsedIcon: ReactNode, expandedIcon: ReactNode];

	/** 是否在收合時隱藏標題（僅 collapsible=true 有效）/ Whether to hide the title when collapsed (only when collapsible=true) */
	hiddenTitleWhenCollapsed?: boolean;
}

/**
 * 可摺疊 Card 元件
 * Collapsible Card component
 *
 * 包裝 antd Card，提供內建的展開/收合切換按鈕
 * 當 collapsible=false 時恢復為一般 antd Card
 * Wraps antd Card with built-in expand/collapse toggle button.
 * When collapsible=false, renders as a plain antd Card.
 *
 * @example
 * <CollapsibleCard title="搜尋與過濾">
 *   <Flex vertical gap="middle">...</Flex>
 * </CollapsibleCard>
 *
 * <CollapsibleCard title="一般卡片" collapsible={false}>
 *   <span>始終顯示的內容</span>
 * </CollapsibleCard>
 */
export const CollapsibleCard = ({
	title,
	children,
	collapsible = true,
	defaultCollapsed = false,
	extra,
	extraOnLeft,
	hideDefaultToggle = false,
	collapsibleIcons,
	hiddenTitleWhenCollapsed,
	...cardProps
}: ICollapsibleCardProps) =>
{
	/**
	 * 控制展開/收合狀態
	 * Controls expand/collapse state
	 */
	const [collapsed, setCollapsed] = useState(defaultCollapsed);

	/**
	 * 非摺疊模式：直接回傳一般 Card，不帶摺疊按鈕，始終顯示內容
	 * Non-collapsible mode: render a plain Card without toggle, always show children
	 */
	if (!collapsible)
	{
		return (
			<Card
				size="small"
				hoverable
				title={title}
				extra={<>
					{extraOnLeft}
					{extra}
				</>}
				{...cardProps}
			>
				{children}
			</Card>
		);
	}

	return (
		<Card
			size="small"
			hoverable
			title={(collapsed && hiddenTitleWhenCollapsed) ? undefined : title}
			extra={
				<>
					{extraOnLeft}
					{!hideDefaultToggle && (
						<Button
							type="text"
							size="small"
							icon={collapsed ? (collapsibleIcons?.[0] ?? <CaretDownOutlined />) : (collapsibleIcons?.[1] ?? <CaretUpOutlined />)}
							onClick={() => setCollapsed(!collapsed)}
						/>
					)}
					{extra}
				</>
			}
			{...cardProps}
		>
			{!collapsed && children}
		</Card>
	);
};
