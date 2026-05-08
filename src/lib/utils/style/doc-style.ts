/**
 * Created by user on 2026/5/8.
 */

import { generateTokenCSSDeclarationsGenerator } from '@/lib/utils/style/antd-css-var-utils';
import { EnumThemeClassName } from '@/lib/utils/style/css-const';

/**
 * 將 token 物件套用為 CSS 變數，注入到 DOM 中
 * Apply token object as CSS variables, inject into DOM
 *
 * 使用 walkTokenObjectGenerator 進行深度遍歷，
 * 透過 <style> 標籤將 CSS 變數注入到指定的選擇器下
 * Uses walkTokenObjectGenerator for deep traversal,
 * injects CSS variables under the specified selector via <style> tag
 *
 * 每個 token 會同時產生兩種 CSS 變數：
 * - 前綴版本（如 --ant-color-primary）
 * - 通用版本（如 --color-primary）
 * Each token produces two CSS variables:
 * - Prefix variant (e.g. --ant-color-primary)
 * - Generic variant (e.g. --color-primary)
 *
 * @param tokens - 包含 token 的物件 / Object containing tokens
 * @param options - 選項 / Options
 * @param options.selector - CSS 選擇器，預設 ':root' / CSS selector, defaults to ':root'
 * @param options.prefix - CSS 變數前綴，預設 'ant-' / CSS variable prefix, defaults to 'ant-'
 * @param options.id - style 元素的 ID（用於重複更新）/ style element ID (for repeated updates)
 * @param options.deep - 是否深度遍歷，預設 true / Whether to deep traverse, defaults to true
 * @param options.emitGeneric - 是否同時產生通用版本，預設 true / Whether to emit generic variant, defaults to true
 *
 * @example
 * ```typescript
 * // 基本用法：注入到 :root
 * applyTokensAsCssVars(antdTokens);
 *
 * // 注入到暗色主題
 * applyTokensAsCssVars(darkTokens, { selector: '.theme-dark', id: 'theme-dark-vars' });
 *
 * // 注入到亮色主題
 * applyTokensAsCssVars(lightTokens, { selector: '.theme-light', id: 'theme-light-vars' });
 * ```
 */
export function applyTokensAsCssVars(
	tokens: Record<string, any>,
	options?: {
		prefix?: string;
		deep?: boolean;
		emitGeneric?: boolean;
		isDark: boolean;
	},
): void
{
	if (!tokens) return;

	const { prefix = 'ant-', deep = true, emitGeneric = true, isDark } = options || {};

	const selectorKey = isDark ? EnumThemeClassName.DARK : EnumThemeClassName.LIGHT;
	const id = `css-vars-${selectorKey.replace(/[^a-zA-Z0-9_-]/g, '')}`;

	/**
	 * 生成 CSS 宣告
	 * Generate CSS declarations
	 *
	 * emitGeneric 預設 true，同時產生前綴和通用兩種 CSS 變數，匹配原始 style.setProperty 行為
	 * emitGeneric defaults to true, produces both prefix and generic CSS vars, matching original style.setProperty behavior
	 */
	const declarations = generateTokenCSSDeclarationsGenerator(tokens, { prefix, deep, emitGeneric });

	const root = document.documentElement;

	let cssBody: string[] = [];

	for (const [cssVar, cssValue] of declarations)
	{
		cssBody.push(`\t${cssVar}: ${cssValue};`);

		root.style.setProperty(cssVar, cssValue);
	}

	const cssBodyText = cssBody.join('\n');

	/**
	 * 建立完整的 CSS 規則
	 * Build complete CSS rule
	 */
	const cssText = `
.${selectorKey} {\n${cssBodyText}\n}
html.${selectorKey}, body.${selectorKey} {\n${cssBodyText}\n}
:root.${selectorKey} {\n${cssBodyText}\n}
`;

	/**
	 * 尋找或建立 <style> 元素
	 * Find or create <style> element
	 */
	const existingStyle = document.getElementById(id);
	if (existingStyle)
	{
		existingStyle.textContent = cssText;
		return;
	}

	const style = document.createElement('style');
	style.id = id;
	style.textContent = cssText;
	document.head.appendChild(style);
}
