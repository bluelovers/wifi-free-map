
import { Select, Tag } from 'antd';
import type { SelectProps, TagProps } from 'antd';
import { ITSPartialPick, ITSPickExtra } from 'ts-type';
import type { BaseSelectRef, SelectProps as RcSelectProps } from '@rc-component/select';
import type { CustomTagProps } from '@rc-component/select/lib/BaseSelect';
import { useCallback } from 'react';

export interface IColoredSelectItem extends ITSPickExtra<CustomTagProps & TagProps, 'color'>
{
	value: string;

	/**
	 * 超過 maxTagCount 之後顯示的 tag
	 *
	 * @example
	 * isMaxTag: true
	 * label: "+ 0 ..."
	 */
	isMaxTag?: CustomTagProps["isMaxTag"],
}

export function ColoredSelect(selectProps: SelectProps<string[], IColoredSelectItem>)
{
	const {
		showSearch,
		style,

		options,

		...restProps
	 } = selectProps;

	console.log('ColoredSelect', selectProps.options);

	const tagRender = useCallback((tagProps: IColoredSelectItem) =>
	{
		const {
			label,
			style,

			isMaxTag,

			...restProps
		} = tagProps;

		const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) =>
		{
			event.preventDefault();
			event.stopPropagation();
		};

		const index = options?.findIndex(option => option.value === tagProps.value);

		const option = isMaxTag ? undefined : options![index!];

		console.log('ColoredSelect:tagRender', {
			label,
			style,

			isMaxTag,

			restProps,

			option,

			index,
		});

		return (
			<Tag
				onMouseDown={onPreventMouseDown}
				{...restProps}
				style={{
					marginInlineEnd: 4,
					// @ts-ignore
					color: option?.colorPreset.text10.toRgbString() || 'gray',
					opacity: isMaxTag ? 0.5 : 1,

					...style,
				}}
				color={option?.color}
				variant={'solid'}
			>
				{label ?? tagProps.value}
			</Tag>
		);
	}, [options]);

	return (
		<Select
			mode="multiple"
			// @ts-ignore
			tagRender={tagRender}

			maxTagCount="responsive"
			allowClear
			tokenSeparators={[',']}

			{...restProps}
			showSearch={{
				optionFilterProp: ['value', 'label'],
				// @ts-ignore
				...showSearch,
			}}
			style={{
				width: '100%',
				...style,
			}}
			options={options}
		/>
	)
}
