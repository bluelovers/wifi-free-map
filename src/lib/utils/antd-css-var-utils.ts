/**
 * Ant Design CSS Variable 工具函數
 * Ant Design CSS Variable Utility Functions
 *
 * 根據 docs/style/antd-css-var.md 建立的轉換工具
 * Conversion utilities based on docs/style/antd-css-var.md
 *
 * @see https://app.dosu.dev/1305af31-9246-4d2d-add3-27e8cdd7f529/ask?thread=939ba633-620b-4072-80e2-54a0dfed6aed
 */

/**
 * 完整的 Antd Token 到 Antd CSS Variable 映射表
 * Complete mapping table from Antd Token to Antd CSS Variable
 *
 * 包含 docs/style/antd-css-var.md 中所有列出的 token
 * Includes all tokens listed in docs/style/antd-css-var.md
 */
const antdTokenToCSSVarMap: Record<string, `--ant-${string}`> = {
	// ==================== 基礎色彩 / Basic Colors ====================
	'colorBgContainer': '--ant-color-bg-container',
	'colorText': '--ant-color-text',
	'colorTextBase': '--ant-color-text-base',
	'colorTextDescription': '--ant-color-text-description',
	'colorPrimary': '--ant-color-primary',
	'controlOutline': '--ant-control-outline',

	// ==================== 按鈕 / Buttons ====================
	'colorTextLightSolid': '--ant-color-text-light-solid',
	'colorPrimaryHover': '--ant-color-primary-hover',
	'colorFillSecondary': '--ant-color-fill-secondary',
	'controlItemBgHover': '--ant-control-item-bg-hover',

	// ==================== 輸入框 / Input ====================
	'colorBorder': '--ant-color-border',
	'colorTextPlaceholder': '--ant-color-text-placeholder',
	'colorErrorBg': '--ant-color-error-bg',
	'colorErrorBorder': '--ant-color-error-border',
	'colorWarningBg': '--ant-color-warning-bg',
	'colorWarningBorder': '--ant-color-warning-border',

	// ==================== 下拉選單 / 彈出層 / Dropdown / Popover ====================
	'colorBgElevated': '--ant-color-bg-elevated',
	'colorBorderSecondary': '--ant-color-border-secondary',

	// ==================== 列表 / 選取 / List / Selection ====================
	'controlItemBgActive': '--ant-control-item-bg-active',
	'colorPrimaryBg': '--ant-color-primary-bg',

	// ==================== 連結 / Links ====================
	'colorLink': '--ant-color-link',
	'colorLinkActive': '--ant-color-link-active',

	// ==================== 狀態色 / Status Colors ====================
	'colorError': '--ant-color-error',
	'colorWarning': '--ant-color-warning',
	'colorInfo': '--ant-color-info',

	// ==================== 面板 / 佈局 / Panel / Layout ====================
	'colorBgLayout': '--ant-color-bg-layout',
	'colorTextHeading': '--ant-color-text-heading',

	// ==================== 徽章 (Badge) / 通知 / Badge / Notification ====================
	// 'colorPrimary' 已定義在上面
	// 'colorTextLightSolid' 已定義在上面

	// ==================== 額外常用衍生 Token / Additional Common Derived Tokens ====================
	'colorTextSecondary': '--ant-color-text-secondary',
	'colorTextTertiary': '--ant-color-text-tertiary',
	'colorTextQuaternary': '--ant-color-text-quaternary',
	'colorFill': '--ant-color-fill',
	'colorFillTertiary': '--ant-color-fill-tertiary',
	'colorFillQuaternary': '--ant-color-fill-quaternary',
	'colorSplit': '--ant-color-split',
	'colorIcon': '--ant-color-icon',
	'colorIconHover': '--ant-color-icon-hover',
	'colorBorderDisabled': '--ant-color-border-disabled',
	'controlItemBgActiveHover': '--ant-control-item-bg-active-hover',
	'colorBgBase': '--ant-color-bg-base',
};

/**
 * 將 camelCase 字串轉換為 kebab-case
 * Convert camelCase string to kebab-case
 *
 * @param str - camelCase 字串 / camelCase string
 * @returns kebab-case 字串 / kebab-case string
 *
 * @example
 * ```typescript
 * camelCaseToKebabCase('colorBgContainer'); // 'color-bg-container'
 * camelCaseToKebabCase('controlItemBgHover'); // 'control-item-bg-hover'
 * ```
 */
export function camelCaseToKebabCase(str: string): string
{
	/** 在小寫字母或數字後面的大寫字母前插入連字符，然後轉為全小寫 */
	/** Insert hyphen before uppercase letters that follow lowercase letters or numbers, then convert to lowercase */
	return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * 將 Antd Token 轉換為 Antd CSS Variable
 * Convert Antd Token to Antd CSS Variable
 *
 * 優先使用映射表查找，若無映射則使用轉換規則
 * Priority uses mapping table lookup, if no mapping then use conversion rule
 *
 * 轉換規則：camelCase token 名稱 → kebab-case，加上 `--ant-` 前綴
 * Conversion rule: camelCase token name → kebab-case, add `--ant-` prefix
 *
 * @param token - Antd Token 名稱 / Antd Token name
 * @returns Antd CSS Variable 名稱 / Antd CSS Variable name
 *
 * @example
 * ```typescript
 * antdTokenToCSSVar('colorBgContainer'); // '--ant-color-bg-container'
 * antdTokenToCSSVar('colorPrimaryHover'); // '--ant-color-primary-hover'
 * ```
 */
export function antdTokenToCSSVar(token: string): `--ant-${string}`
{
	/** 優先從映射表中查找 */
	/** Priority lookup from mapping table */
	if (antdTokenToCSSVarMap[token])
	{
		return antdTokenToCSSVarMap[token];
	}

	/** 若映射表中無，則使用轉換規則 */
	/** If not in mapping table, use conversion rule */
	const kebabCase = camelCaseToKebabCase(token);
	return `--ant-${kebabCase}`;
}

/**
 * 將 token 物件中的 token 值自動轉換為 Antd CSS Variable
 * Automatically convert token values in a token object to Antd CSS Variables
 *
 * 此函數會遍歷物件的所有屬性，若屬性值是字串且存在於映射表中，
 * 則將其轉換為對應的 CSS Variable
 * This function iterates through all properties of the object. If a property value
 * is a string and exists in the mapping table, it converts it to the corresponding CSS Variable.
 *
 * @param tokenObj - 包含 token 的物件 / Object containing tokens
 * @param options - 選項 / Options
 * @param options.deep - 是否深度遍歷巢狀物件 / Whether to deep traverse nested objects
 * @param options.override - 是否覆寫原始物件（默認 false，返回新物件）/ Whether to override original object (default false, returns new object)
 * @returns 轉換後的物件 / Converted object
 *
 * @example
 * ```typescript
 * const config = {
 *   primaryColor: 'colorPrimary',
 *   bgColor: 'colorBgContainer',
 *   nested: {
 *     textColor: 'colorText'
 *   }
 * };
 *
 * // 淺層轉換（默認）
 * // Shallow conversion (default)
 * const result1 = convertTokenObjectToCSSVar(config);
 * // result1 = {
 * //   primaryColor: '--ant-color-primary',
 * //   bgColor: '--ant-color-bg-container',
 * //   nested: { textColor: 'colorText' } // 未深度遍歷，保持原樣
 * // }
 *
 * // 深度轉換
 * // Deep conversion
 * const result2 = convertTokenObjectToCSSVar(config, { deep: true });
 * // result2 = {
 * //   primaryColor: '--ant-color-primary',
 * //   bgColor: '--ant-color-bg-container',
 * //   nested: { textColor: '--ant-color-text' }
 * // }
 * ```
 */
export function convertTokenObjectToCSSVar<T extends Record<string, any>>(
	tokenObj: T,
	options?: {
		deep?: boolean;
		override?: boolean;
	}
): T
{
	const { deep = false, override = false } = options || {};

	/** 決定要修改的目標物件 */
	/** Determine target object to modify */
	const target: Record<string, any> = override ? tokenObj : { ...tokenObj };

	/**
	 * 遞迴轉換函數
	 * Recursive conversion function
	 */
	function convertValue(value: any): any
	{
		/** 若為字串，嘗試從映射表轉換 */
		/** If string, try to convert from mapping table */
		if (typeof value === 'string')
		{
			return antdTokenToCSSVar(value);
		}

		/** 若啟用深度轉換且為物件（非 null 且非陣列），則遞迴處理 */
		/** If deep conversion enabled and is object (not null and not array), recursively process */
		if (deep && value && typeof value === 'object' && !Array.isArray(value))
		{
			const converted: Record<string, any> = { ...value };
			for (const key of Object.keys(converted))
			{
				converted[key] = convertValue(converted[key]);
			}
			return converted;
		}

		/** 其他情況直接返回值 */
		/** In other cases, return value directly */
		return value;
	}

	/** 遍歷物件屬性並轉換 */
	/** Iterate object properties and convert */
	for (const key of Object.keys(target))
	{
		target[key] = convertValue(target[key]);
	}

	return target as T;
}

/**
 * 獲取完整的 Antd Token 到 Antd CSS Variable 映射表
 * Get complete mapping table from Antd Token to Antd CSS Variable
 *
 * @returns 完整映射表 / Complete mapping table
 */
export function getAllAntdTokenToCSSVarMappings(): Record<string, `--ant-${string}`>
{
	return { ...antdTokenToCSSVarMap };
}

/**
 * 將 token 物件的 key 自動轉換為 CSS Variable 形式
 * Automatically convert token object keys to CSS Variable format
 *
 * 此函數會遍歷物件的所有屬性，將屬性名稱（key）從 token 形式
 * 轉換為對應的 CSS Variable 形式（camelCase → kebab-case + --ant- 前綴）
 * This function iterates through all properties of the object, converting property names (keys)
 * from token format to corresponding CSS Variable format (camelCase → kebab-case + --ant- prefix)
 *
 * @param tokenObj - 包含 token 作為 key 的物件 / Object with tokens as keys
 * @param options - 選項 / Options
 * @param options.deep - 是否深度遍歷巢狀物件 / Whether to deep traverse nested objects
 * @param options.override - 是否覆寫原始物件（默認 false，返回新物件）/ Whether to override original object (default false, returns new object)
 * @returns 轉換後的物件，key 為 CSS Variable 形式 / Converted object with CSS Variable format keys
 *
 * @example
 * ```typescript
 * const tokenConfig = {
 *   colorPrimary: '#1890ff',
 *   colorBgContainer: '#ffffff',
 *   nested: {
 *     colorText: '#000000'
 *   }
 * };
 *
 * // 淺層轉換（默認）
 * // Shallow conversion (default)
 * const result1 = convertTokenKeysToCSSVar(tokenConfig);
 * // result1 = {
 * //   '--ant-color-primary': '#1890ff',
 * //   '--ant-color-bg-container': '#ffffff',
 * //   nested: { colorText: '#000000' } // 未深度遍歷，保持原樣
 * // }
 *
 * // 深度轉換
 * // Deep conversion
 * const result2 = convertTokenKeysToCSSVar(tokenConfig, { deep: true });
 * // result2 = {
 * //   '--ant-color-primary': '#1890ff',
 * //   '--ant-color-bg-container': '#ffffff',
 * //   nested: { '--ant-color-text': '#000000' }
 * // }
 * ```
 */
export function convertTokenKeysToCSSVar<T extends Record<string, any>>(
	tokenObj: T,
	options?: {
		deep?: boolean;
		override?: boolean;
	}
): Record<string, any>
{
	const { deep = false, override = false } = options || {};

	/** 決定要修改的目標物件 */
	/** Determine target object to modify */
	const target: Record<string, any> = override ? tokenObj : {};

	/**
	 * 遞迴轉換函數
	 * Recursive conversion function
	 */
	function convertObject(obj: Record<string, any>): Record<string, any>
	{
		const result: Record<string, any> = {};

		for (const key of Object.keys(obj))
		{
			/** 將 key 轉換為 CSS Variable 形式 */
			/** Convert key to CSS Variable format */
			const cssVarKey = antdTokenToCSSVar(key);
			const value = obj[key];

			/** 若啟用深度轉換且值為物件（非 null 且非陣列），則遞迴處理 */
			/** If deep conversion enabled and value is object (not null and not array), recursively process */
			if (deep && value && typeof value === 'object' && !Array.isArray(value))
			{
				result[cssVarKey] = convertObject(value);
			}
			else
			{
				result[cssVarKey] = value;
			}
		}

		return result;
	}

	/** 若覆寫原始物件，需要處理原始物件的每個屬性 */
	/** If overriding original object, need to process each property of original object */
	if (override)
	{
		const newObj = convertObject(tokenObj as Record<string, any>);
		/** 清空原始物件 / Clear original object */
		/** 清空原始物件 / Clear original object */
		for (const key of Object.keys(target))
		{
			delete target[key];
		}
		/** 複製新屬性到目標物件 / Copy new properties to target object */
		/** 複製新屬性到目標物件 / Copy new properties to target object */
		for (const key of Object.keys(newObj))
		{
			target[key] = newObj[key];
		}
		return target;
	}

	/** 不覆寫原始物件，返回新物件 */
	/** Not overriding original object, return new object */
	return convertObject(tokenObj as Record<string, any>);
}

/**
 * 同時轉換 token 物件的 key 和 value 為 CSS Variable 形式
 * Convert both keys and values of token object to CSS Variable format
 *
 * 此函數會將物件的 key 和 value 都轉換為 CSS Variable 形式
 * This function converts both keys and values of the object to CSS Variable format
 *
 * @param tokenObj - 包含 token 作為 key 和 value 的物件 / Object with tokens as both keys and values
 * @param options - 選項 / Options
 * @param options.deep - 是否深度遍歷巢狀物件 / Whether to deep traverse nested objects
 * @param options.override - 是否覆寫原始物件 / Whether to override original object
 * @returns 轉換後的物件 / Converted object
 *
 * @example
 * ```typescript
 * const tokenObj = {
 *   colorPrimary: 'colorPrimary',
 *   colorBgContainer: 'colorBgContainer'
 * };
 *
 * const result = convertTokenObjectKeysAndValuesToCSSVar(tokenObj);
 * // result = {
 * //   '--ant-color-primary': '--ant-color-primary',
 * //   '--ant-color-bg-container': '--ant-color-bg-container'
 * // }
 * ```
 */
export function convertTokenObjectKeysAndValuesToCSSVar<T extends Record<string, any>>(
	tokenObj: T,
	options?: {
		deep?: boolean;
		override?: boolean;
	}
): Record<string, any>
{
	/** 先轉換 key */
	/** First convert keys */
	const keysConverted = convertTokenKeysToCSSVar(tokenObj, { ...options, override: false });

	/** 再轉換 value */
	/** Then convert values */
	const result = convertTokenObjectToCSSVar(keysConverted, { ...options, override: false });

	return result;
}

/**
 * Generator 模式：逐步將 token 物件的 key 轉換為 CSS Variable 形式
 * Generator pattern: Step-by-step convert token object keys to CSS Variable format
 *
 * 使用 yield 逐步返回轉換後的 [key, value] 對，適用於大型物件或需要逐步處理的場景
 * Uses yield to step-by-step return converted [key, value] pairs, suitable for large objects or scenarios requiring step-by-step processing
 *
 * @param tokenObj - 包含 token 作為 key 的物件 / Object with tokens as keys
 * @param options - 選項 / Options
 * @param options.deep - 是否深度遍歷巢狀物件 / Whether to deep traverse nested objects
 * @yields 轉換後的 [cssVarKey, value] 對 / Yielded converted [cssVarKey, value] pairs
 *
 * @example
 * ```typescript
 * const tokenConfig = {
 *   colorPrimary: '#1890ff',
 *   colorBgContainer: '#ffffff',
 *   nested: {
 *     colorText: '#000000'
 *   }
 * };
 *
 * // 使用 for...of 迭代
 * // Use for...of iteration
 * for (const [cssVarKey, value] of convertTokenKeysToCSSVarGenerator(tokenConfig, { deep: true })) {
 *   console.log(cssVarKey, value);
 *   // '--ant-color-primary' '#1890ff'
 *   // '--ant-color-bg-container' '#ffffff'
 *   // '--ant-color-text' '#000000'
 * }
 *
 * // 手動控制迭代
 * // Manual iteration control
 * const gen = convertTokenKeysToCSSVarGenerator(tokenConfig);
 * console.log(gen.next()); // { value: ['--ant-color-primary', '#1890ff'], done: false }
 * console.log(gen.next()); // { value: ['--ant-color-bg-container', '#ffffff'], done: false }
 * console.log(gen.next()); // { value: undefined, done: true }
 * ```
 */
export function* convertTokenKeysToCSSVarGenerator(
	tokenObj: Record<string, any>,
	options?: {
		deep?: boolean;
	}
): Generator<[string, any], void, unknown>
{
	const { deep = false } = options || {};

	/**
	 * 遞迴處理物件
	 * Recursive processing function
	 */
	function* processObject(obj: Record<string, any>): Generator<[string, any], void, unknown>
	{
		for (const key of Object.keys(obj))
		{
			/** 將 key 轉換為 CSS Variable 形式 */
			/** Convert key to CSS Variable format */
			const cssVarKey = antdTokenToCSSVar(key);
			const value = obj[key];

			/** 若啟用深度轉換且值為物件（非 null 且非陣列），則遞迴處理 */
			/** If deep conversion enabled and value is object (not null and not array), recursively process */
			if (deep && value && typeof value === 'object' && !Array.isArray(value))
			{
				yield* processObject(value);
			}
			else
			{
				yield [cssVarKey, value] as [string, any];
			}
		}
	}

	yield* processObject(tokenObj);
}

/**
 * Generator 模式：逐步將 token 物件的 value 轉換為 CSS Variable
 * Generator pattern: Step-by-step convert token object values to CSS Variable
 *
 * 使用 yield 逐步返回轉換後的 [key, cssVarValue] 對
 * Uses yield to step-by-step return converted [key, cssVarValue] pairs
 *
 * @param tokenObj - 包含 token 作為 value 的物件 / Object with tokens as values
 * @param options - 選項 / Options
 * @param options.deep - 是否深度遍歷巢狀物件 / Whether to deep traverse nested objects
 * @yields 轉換後的 [key, cssVarValue] 對 / Yielded converted [key, cssVarValue] pairs
 *
 * @example
 * ```typescript
 * const config = {
 *   primaryColor: 'colorPrimary',
 *   bgColor: 'colorBgContainer',
 *   nested: {
 *     textColor: 'colorText'
 *   }
 * };
 *
 * const gen = convertTokenObjectToCSSVarGenerator(config, { deep: true });
 * for (const [key, cssVarValue] of gen) {
 *   console.log(key, cssVarValue);
 *   // 'primaryColor' '--ant-color-primary'
 *   // 'bgColor' '--ant-color-bg-container'
 *   // 'textColor' '--ant-color-text'
 * }
 * ```
 */
export function* convertTokenObjectToCSSVarGenerator(
	tokenObj: Record<string, any>,
	options?: {
		deep?: boolean;
	}
): Generator<[string, `--ant-${string}`], void, unknown>
{
	const { deep = false } = options || {};

	/**
	 * 遞迴處理物件
	 * Recursive processing function
	 */
	function* processObject(obj: Record<string, any>): Generator<[string, `--ant-${string}`], void, unknown>
	{
		for (const key of Object.keys(obj))
		{
			const value = obj[key];

			/** 若為字串，嘗試轉換 */
			/** If string, try to convert */
			if (typeof value === 'string')
			{
				const cssVarValue = antdTokenToCSSVar(value);
				yield [key, cssVarValue] as [string, `--ant-${string}`];
			}
			/** 若啟用深度轉換且值為物件（非 null 且非陣列），則遞迴處理 */
			/** If deep conversion enabled and value is object (not null and not array), recursively process */
			else if (deep && value && typeof value === 'object' && !Array.isArray(value))
			{
				yield* processObject(value);
			}
			/** 其他情況，直接返回原始值 */
			/** In other cases, return original value directly */
			else
			{
				yield [key, value] as [string, `--ant-${string}`];
			}
		}
	}

	yield* processObject(tokenObj);
}

/**
 * Generator 模式：同時逐步轉換 token 物件的 key 和 value
 * Generator pattern: Step-by-step convert both keys and values of token object
 *
 * 使用 yield 逐步返回轉換後的 [cssVarKey, cssVarValue] 對
 * Uses yield to step-by-step return converted [cssVarKey, cssVarValue] pairs
 *
 * @param tokenObj - 包含 token 作為 key 和 value 的物件 / Object with tokens as both keys and values
 * @param options - 選項 / Options
 * @param options.deep - 是否深度遍歷巢狀物件 / Whether to deep traverse nested objects
 * @yields 轉換後的 [cssVarKey, cssVarValue] 對 / Yielded converted [cssVarKey, cssVarValue] pairs
 *
 * @example
 * ```typescript
 * const tokenObj = {
 *   colorPrimary: 'colorPrimary',
 *   colorBgContainer: 'colorBgContainer'
 * };
 *
 * const gen = convertTokenObjectKeysAndValuesToCSSVarGenerator(tokenObj);
 * for (const [cssVarKey, cssVarValue] of gen) {
 *   console.log(cssVarKey, cssVarValue);
 *   // '--ant-color-primary' '--ant-color-primary'
 *   // '--ant-color-bg-container' '--ant-color-bg-container'
 * }
 * ```
 */
export function* convertTokenObjectKeysAndValuesToCSSVarGenerator(
	tokenObj: Record<string, any>,
	options?: {
		deep?: boolean;
	}
): Generator<[string, `--ant-${string}`], void, unknown>
{
	const { deep = false } = options || {};

	/**
	 * 遞迴處理物件
	 * Recursive processing function
	 */
	function* processObject(obj: Record<string, any>): Generator<[string, `--ant-${string}`], void, unknown>
	{
		for (const key of Object.keys(obj))
		{
			/** 轉換 key */
			/** Convert key */
			const cssVarKey = antdTokenToCSSVar(key);
			const value = obj[key];

			/** 若為字串，轉換 value */
			/** If string, convert value */
			if (typeof value === 'string')
			{
				const cssVarValue = antdTokenToCSSVar(value);
				yield [cssVarKey, cssVarValue] as [string, `--ant-${string}`];
			}
			/** 若啟用深度轉換且值為物件（非 null 且非陣列），則遞迴處理 */
			/** If deep conversion enabled and value is object (not null and not array), recursively process */
			else if (deep && value && typeof value === 'object' && !Array.isArray(value))
			{
				yield* processObject(value);
			}
			/** 其他情況，直接返回 key 轉換後的結果，value 保持原樣 */
			/** In other cases, return key converted result, value remains unchanged */
			else
			{
				yield [cssVarKey, value] as [string, `--ant-${string}`];
			}
		}
	}

	yield* processObject(tokenObj);
}

/**
 * Generator 模式：逐步迭代完整映射表
 * Generator pattern: Step-by-step iterate complete mapping table
 *
 * 使用 yield 逐步返回映射表中的每一個 [token, cssVar] 對
 * Uses yield to step-by-step return each [token, cssVar] pair from the mapping table
 *
 * @yields 映射表中的 [token, cssVar] 對 / Yielded [token, cssVar] pairs from mapping table
 *
 * @example
 * ```typescript
 * const gen = allAntdTokenMappingsGenerator();
 *
 * for (const [token, cssVar] of gen) {
 *   console.log(token, cssVar);
 *   // 'colorBgContainer' '--ant-color-bg-container'
 *   // 'colorText' '--ant-color-text'
 *   // ...
 * }
 * ```
 */
export function* allAntdTokenMappingsGenerator(): Generator<[string, `--ant-${string}`], void, unknown>
{
	for (const [token, cssVar] of Object.entries(antdTokenToCSSVarMap))
	{
		yield [token, cssVar] as [string, `--ant-${string}`];
	}
}

/**
 * VS Code CSS Variable 到 Antd CSS Variable 的映射表
 * Mapping table from VS Code CSS Variable to Antd CSS Variable
 */
const vsCodeToAntdCSSVarMap: Record<`--vscode-${string}`, `--ant-${string}`> = {
	// 基礎色彩 / Basic Colors
	'--vscode-editor-background': '--ant-color-bg-container',
	'--vscode-editor-foreground': '--ant-color-text',
	'--vscode-foreground': '--ant-color-text-base',
	'--vscode-descriptionForeground': '--ant-color-text-description',
	'--vscode-focusBorder': '--ant-color-primary',

	// 按鈕 / Buttons
	'--vscode-button-background': '--ant-color-primary',
	'--vscode-button-foreground': '--ant-color-text-light-solid',
	'--vscode-button-hoverBackground': '--ant-color-primary-hover',
	'--vscode-button-secondaryBackground': '--ant-color-fill-secondary',
	'--vscode-button-secondaryForeground': '--ant-color-text',
	'--vscode-button-secondaryHoverBackground': '--ant-control-item-bg-hover',

	// 輸入框 / Input
	'--vscode-input-background': '--ant-color-bg-container',
	'--vscode-input-foreground': '--ant-color-text',
	'--vscode-input-border': '--ant-color-border',
	'--vscode-input-placeholderForeground': '--ant-color-text-placeholder',
	'--vscode-inputOption-activeBorder': '--ant-color-primary',
	'--vscode-inputValidation-errorBackground': '--ant-color-error-bg',
	'--vscode-inputValidation-errorBorder': '--ant-color-error-border',
	'--vscode-inputValidation-warningBackground': '--ant-color-warning-bg',
	'--vscode-inputValidation-warningBorder': '--ant-color-warning-border',

	// 下拉選單 / 彈出層 / Dropdown / Popover
	'--vscode-dropdown-background': '--ant-color-bg-elevated',
	'--vscode-dropdown-foreground': '--ant-color-text',
	'--vscode-dropdown-border': '--ant-color-border-secondary',

	// 列表 / 選取 / List / Selection
	'--vscode-list-activeSelectionBackground': '--ant-control-item-bg-active',
	'--vscode-list-activeSelectionForeground': '--ant-color-primary',
	'--vscode-list-hoverBackground': '--ant-control-item-bg-hover',
	'--vscode-list-focusBackground': '--ant-control-item-bg-active',
	'--vscode-editor-selectionBackground': '--ant-color-primary-bg',

	// 連結 / Links
	'--vscode-textLink-foreground': '--ant-color-link',
	'--vscode-textLink-activeForeground': '--ant-color-link-active',

	// 狀態色 / Status Colors
	'--vscode-errorForeground': '--ant-color-error',
	'--vscode-warningForeground': '--ant-color-warning',
	'--vscode-infoForeground': '--ant-color-info',
	'--vscode-progressBar-background': '--ant-color-primary',

	// 面板 / 佈局 / Panel / Layout
	'--vscode-panel-background': '--ant-color-bg-layout',
	'--vscode-panel-border': '--ant-color-border',
	'--vscode-sideBar-background': '--ant-color-bg-layout',
	'--vscode-sideBarTitle-foreground': '--ant-color-text-heading',

	// 徽章 (Badge) / 通知 / Badge / Notification
	'--vscode-badge-background': '--ant-color-primary',
	'--vscode-badge-foreground': '--ant-color-text-light-solid',
	'--vscode-notifications-background': '--ant-color-bg-elevated',
	'--vscode-notifications-foreground': '--ant-color-text',
};

/**
 * Antd CSS Variable 到 VS Code CSS Variable 的映射表（反向映射）
 * Mapping table from Antd CSS Variable to VS Code CSS Variable (reverse mapping)
 *
 * 注意：由於多個 VS Code 變數可能對應到同一個 Antd 變數，
 * 此映射僅保留第一個匹配的 VS Code 變數
 * Note: Since multiple VS Code variables may map to the same Antd variable,
 * this mapping keeps only the first matched VS Code variable
 */
const antdCSSVarToVScodeCSSVarMap: Record<string, string> = {};

/**
 * 初始化反向映射表
 * Initialize reverse mapping table
 */
function _initReverseMap(): void
{
	for (const [vsCodeVar, antdCSSVar] of Object.entries(vsCodeToAntdCSSVarMap))
	{
		/** 只保留第一個匹配的 VS Code 變數，避免覆寫 */
		/** Only keep the first matched VS Code variable to avoid overwriting */
		if (!antdCSSVarToVScodeCSSVarMap[antdCSSVar])
		{
			antdCSSVarToVScodeCSSVarMap[antdCSSVar] = vsCodeVar;
		}
	}
}

/** 初始化反向映射 */
/** Initialize reverse mapping */
_initReverseMap();

/**
 * Antd Token 到 VS Code CSS Variable 的映射表
 * Mapping table from Antd Token to VS Code CSS Variable
 */
const antdTokenToVScodeCSSVarMap: Record<string, `--vscode-${string}`> = {
	// 基礎色彩 / Basic Colors
	'colorBgContainer': '--vscode-editor-background',
	'colorText': '--vscode-editor-foreground',
	'colorTextBase': '--vscode-foreground',
	'colorTextDescription': '--vscode-descriptionForeground',
	'colorPrimary': '--vscode-focusBorder',
	'controlOutline': '--vscode-focusBorder',

	// 按鈕 / Buttons
	// 'colorPrimary' 已定義在上面
	'colorTextLightSolid': '--vscode-button-foreground',
	'colorPrimaryHover': '--vscode-button-hoverBackground',
	'colorFillSecondary': '--vscode-button-secondaryBackground',
	// 'colorText' 已定義在上面
	'controlItemBgHover': '--vscode-button-secondaryHoverBackground',

	// 輸入框 / Input
	// 'colorBgContainer' 已定義在上面
	// 'colorText' 已定義在上面
	'colorBorder': '--vscode-input-border',
	'colorTextPlaceholder': '--vscode-input-placeholderForeground',
	// 'colorPrimary' 已定義在上面
	'colorErrorBg': '--vscode-inputValidation-errorBackground',
	'colorErrorBorder': '--vscode-inputValidation-errorBorder',
	'colorWarningBg': '--vscode-inputValidation-warningBackground',
	'colorWarningBorder': '--vscode-inputValidation-warningBorder',

	// 下拉選單 / 彈出層 / Dropdown / Popover
	'colorBgElevated': '--vscode-dropdown-background',
	// 'colorText' 已定義在上面
	'colorBorderSecondary': '--vscode-dropdown-border',

	// 列表 / 選取 / List / Selection
	'controlItemBgActive': '--vscode-list-activeSelectionBackground',
	// 'colorPrimary' 已定義在上面
	// 'controlItemBgHover' 已定義在上面
	// 'controlItemBgActive' 已定義在上面
	'colorPrimaryBg': '--vscode-editor-selectionBackground',

	// 連結 / Links
	'colorLink': '--vscode-textLink-foreground',
	'colorLinkActive': '--vscode-textLink-activeForeground',

	// 狀態色 / Status Colors
	'colorError': '--vscode-errorForeground',
	'colorWarning': '--vscode-warningForeground',
	'colorInfo': '--vscode-infoForeground',
	// 'colorPrimary' 已定義在上面

	// 面板 / 佈局 / Panel / Layout
	'colorBgLayout': '--vscode-panel-background',
	// 'colorBorder' 已定義在上面
	// 'colorBgLayout' 已定義在上面
	'colorTextHeading': '--vscode-sideBarTitle-foreground',

	// 徽章 (Badge) / 通知 / Badge / Notification
	// 'colorPrimary' 已定義在上面
	// 'colorTextLightSolid' 已定義在上面
	// 'colorBgElevated' 已定義在上面
	// 'colorText' 已定義在上面
};

/**
 * 將 Antd Token 轉換為 VS Code CSS Variable
 * Convert Antd Token to VS Code CSS Variable
 *
 * @param token - Antd Token 名稱 / Antd Token name
 * @returns VS Code CSS Variable 名稱，若無對應則返回 undefined / VS Code CSS Variable name, or undefined if no mapping exists
 *
 * @example
 * ```typescript
 * antdTokenToVSCodeCSSVar('colorPrimary'); // '--vscode-focusBorder'
 * antdTokenToVSCodeCSSVar('colorBgContainer'); // '--vscode-editor-background'
 * antdTokenToVSCodeCSSVar('nonExistent'); // undefined
 * ```
 */
export function antdTokenToVSCodeCSSVar(token: string): `--vscode-${string}` | undefined
{
	return antdTokenToVScodeCSSVarMap[token];
}

/**
 * 將 Antd CSS Variable 轉換為 VS Code CSS Variable
 * Convert Antd CSS Variable to VS Code CSS Variable
 *
 * @param cssVar - Antd CSS Variable 名稱 / Antd CSS Variable name
 * @returns VS Code CSS Variable 名稱，若無對應則返回 undefined / VS Code CSS Variable name, or undefined if no mapping exists
 *
 * @example
 * ```typescript
 * antdCSSVarToVSCodeCSSVar('--ant-color-primary'); // '--vscode-focusBorder'
 * antdCSSVarToVSCodeCSSVar('--ant-color-bg-container'); // '--vscode-editor-background'
 * antdCSSVarToVSCodeCSSVar('--ant-non-existent'); // undefined
 * ```
 */
export function antdCSSVarToVSCodeCSSVar(cssVar: `--ant-${string}`): `--vscode-${string}` | undefined
{
	return antdCSSVarToVScodeCSSVarMap[cssVar];
}

/**
 * 將 VS Code CSS Variable 轉換為 Antd CSS Variable
 * Convert VS Code CSS Variable to Antd CSS Variable
 *
 * @param vsCodeVar - VS Code CSS Variable 名稱 / VS Code CSS Variable name
 * @returns Antd CSS Variable 名稱，若無對應則返回 undefined / Antd CSS Variable name, or undefined if no mapping exists
 *
 * @example
 * ```typescript
 * vsCodeCSSVarToAntdCSSVar('--vscode-focusBorder'); // '--ant-color-primary'
 * vsCodeCSSVarToAntdCSSVar('--vscode-editor-background'); // '--ant-color-bg-container'
 * vsCodeCSSVarToAntdCSSVar('--vscode-non-existent'); // undefined
 * ```
 */
export function vsCodeCSSVarToAntdCSSVar(vsCodeVar: `--vscode-${string}`): `--ant-${string}` | undefined
{
	return vsCodeToAntdCSSVarMap[vsCodeVar];
}

/**
 * 將 Antd Token 轉換為 VS Code CSS Variable（透過 Antd CSS Variable 中轉）
 * Convert Antd Token to VS Code CSS Variable (via Antd CSS Variable as intermediate)
 *
 * 此函數結合了 antdTokenToCSSVar 和 antdCSSVarToVSCodeCSSVar 的功能
 * This function combines antdTokenToCSSVar and antdCSSVarToVSCodeCSSVar
 *
 * @param token - Antd Token 名稱 / Antd Token name
 * @returns VS Code CSS Variable 名稱，若無對應則返回 undefined / VS Code CSS Variable name, or undefined if no mapping exists
 *
 * @example
 * ```typescript
 * antdTokenToVSCodeCSSVarViaCSSVar('colorPrimary'); // '--vscode-focusBorder'
 * ```
 */
export function antdTokenToVSCodeCSSVarViaCSSVar(token: string): `--vscode-${string}` | undefined
{
	const cssVar = antdTokenToCSSVar(token);
	return antdCSSVarToVSCodeCSSVar(cssVar);
}

/**
 * 獲取所有 VS Code CSS Variable 到 Antd CSS Variable 的映射
 * Get all VS Code CSS Variable to Antd CSS Variable mappings
 *
 * @returns 映射表 / Mapping table
 */
export function getAllVScodeToAntdCSSVarMappings(): Record<`--vscode-${string}`, `--ant-${string}`>
{
	return { ...vsCodeToAntdCSSVarMap };
}

/**
 * 獲取所有 Antd CSS Variable 到 VS Code CSS Variable 的映射
 * Get all Antd CSS Variable to VS Code CSS Variable mappings
 *
 * @returns 映射表 / Mapping table
 */
export function getAllAntdCSSVarToVScodeMappings(): Record<`--ant-${string}`, `--vscode-${string}`>
{
	return { ...antdCSSVarToVScodeCSSVarMap };
}

/**
 * 獲取所有 Antd Token 到 VS Code CSS Variable 的映射
 * Get all Antd Token to VS Code CSS Variable mappings
 *
 * @returns 映射表 / Mapping table
 */
export function getAllAntdTokenToVScodeMappings(): Record<string, `--vscode-${string}`>
{
	return { ...antdTokenToVScodeCSSVarMap };
}
