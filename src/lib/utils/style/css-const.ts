/**
 * Created by user on 2026/5/8.
 */

export type ICssVarKeyAntd = `--ant-${string}`;
export type ICssVarKeyVsCode = `--vscode-${string}`;
export type ICssVarKey<T extends string = string> = `--${T}`;

export const enum EnumThemeClassName
{
	DARK = 'theme-dark',
	LIGHT = 'theme-light',
}

export const enum EnumThemeDataAttr
{
	DARK = 'dark',
	LIGHT = 'light',
	SYSTEM = 'system',
}

