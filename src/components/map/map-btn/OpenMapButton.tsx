import { IStationBase } from '@/types/station-base';
import { CompassOutlined, GlobalOutlined } from '@ant-design/icons';
import { Button } from 'antd';


export interface IOpenMapButtonSharedProps<T extends IStationBase>
{
	onOpenMap?(item: T, isNavigation?: boolean): void;
}

export interface IOpenMapButtonProps<T extends IStationBase> extends IOpenMapButtonSharedProps<T>
{
	item: T;
}

export function OpenMapButton<T extends IStationBase>(props: IOpenMapButtonProps<T>)
{
	if (!props.onOpenMap)
	{
		return null
	}

	return (<>
		<Button
			size="small"
			icon={<GlobalOutlined />}
			onClick={(e) =>
			{
				e.stopPropagation();
				props.onOpenMap!(props.item);
			}}
		>
			&nbsp;地圖
		</Button>
		<Button
			size="small"
			icon={<CompassOutlined />}
			onClick={(e) =>
			{
				e.stopPropagation();
				props.onOpenMap!(props.item, true);
			}}
		>
			&nbsp;導航
		</Button>
	</>)
}
