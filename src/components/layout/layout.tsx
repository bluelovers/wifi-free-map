import { Layout } from 'antd';
import React, { ComponentProps } from 'react';
import { EnumListDisplayMode } from '@/lib/store/localStorage';

export function LayoutSiderConditional(props: ComponentProps<typeof Layout.Sider>)
{
	return (<Layout.Sider {...props}>
		{props.collapsed ? null : props.children}
	</Layout.Sider>);
}

export function ConditionalLayoutMain(props: {
	effectiveListDisplayMode: EnumListDisplayMode,
	children: React.JSX.Element,

	bottomListPanel: React.JSX.Element,
})
{
	if (props.effectiveListDisplayMode !== 'sidebar')
	{
		return (
			/* 底部面板模式：地圖 + 底部列表面板 */
			<Layout style={{ flex: 1, overflow: 'hidden' }}>
				{props.children}

				{/* 底部列表面板 / Bottom list panel */}
				{props.bottomListPanel}
			</Layout>
		);
	}

	return props.children;
}
