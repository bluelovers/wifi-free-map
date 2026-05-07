import { Layout } from 'antd';
import { ComponentProps } from 'react';

export function LayoutSiderConditional(props: ComponentProps<typeof Layout.Sider>)
{
	return (<Layout.Sider {...props}>
		{props.collapsed ? null : props.children}
	</Layout.Sider>);
}
