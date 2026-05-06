import { IOptions, loopColors } from 'loop-colors';
import { paletteLazyHex } from '@lazy-color/palette-lazy';
import { AnyColor, colord, Colord, extend } from 'colord';
import { IColorInput } from 'colord-rand-loop';
import mixPlugin from 'colord/plugins/mix';
import labPlugin from 'colord/plugins/lab';
import namesPlugin from 'colord/plugins/names';
import lchPlugin from "colord/plugins/lch";

extend([mixPlugin, labPlugin, namesPlugin, lchPlugin]);

/**
 * 創建「用完後生成」模式的生成器
 * Create "generate after exhausted" mode generator
 *
 * 演算法：
 * 1. idx < colors.length 時：直接返回預設顏色
 * 2. idx >= colors.length 時：
 *    - 從最後一個預設顏色開始
 *    - 隨機旋轉 ±60度
 *    - 隨機調整亮度 ±15%
 *
 * @param initialColors - 初始預設顏色陣列
 * @returns 可用於 loopColors 的 generator 函數
 */
function _createExhaustGenerator(): IOptions<string, Colord>['generator']
{
	return (colors, position, idx) =>
	{
		const color = colord(colors[position]);

		if (idx < colors.length)
		{
			/** 第一輪：直接使用初始顏色 */
			return color;
		}
		else
		{
			/** 初始顏色用完了，開始產生變化 */
			return color
				.rotate((Math.random() - 0.5) * 120)
				.lighten(Math.random() * 0.3 - 0.15);
		}
	};
}

/**
 * 從基準顏色生成隨機相近色
 * Generate random similar color from base
 *
 * 演算法：
 * 1. 旋轉色相：隨機偏移 ±40度 (rotateDeg = (random - 0.5) * 80)
 * 2. 調整亮度：隨機調整 ±10% (lightenAmount = (random - 0.5) * 0.2)
 *
 * 這種方式產生的顏色與基準顏色保持視覺上的關聯性，
 * 不會看起來完全無關。
 *
 * @param baseColor - 基準顏色
 * @returns 相近的隨機顏色
 */
function _createSimilarColor(baseColor: IColorInput)
{
	const base = colord(baseColor);

	/** 随机旋轉色相 (±40度) */
	const rotateDeg = (Math.random() - 0.5) * 80;
	/** 随机調整亮度 (±10%) */
	const lightenAmount = (Math.random() - 0.5) * 0.2;

	let newColor = base.rotate(rotateDeg);

	if (lightenAmount > 0)
	{
		newColor = newColor.lighten(lightenAmount);
	}
	else
	{
		newColor = newColor.darken(Math.abs(lightenAmount));
	}

	return newColor;
}

export function _generateColorPresetOutlined(baseHex: IColorInput)
{
	const base = colord(baseHex);
	const hsl = base.toHsl();
	const baseH = hsl.h;
	const baseS = hsl.s;
	const baseL = hsl.l;

	// ============ text ============
	const text = colord({ h: baseH + 2, s: baseS * 1.05, l: baseL + 11.5 });

	// ============ bg ============
	const bg = colord({ h: baseH - 3, s: baseS * 0.45, l: baseL <= 45 ? 14 : 12 });

	// ============ border ============
	// 目标: c0 L=22, c10 L=35
	// 两者的目标完全不同，需要两种公式
	let borderL: number;
	if (baseL < 35)
	{
		// 暗 base (<35): 固定较亮
		borderL = 35;
	}
	else if (baseL < 48)
	{
		// 中等 base (35-48): 目标约 22-35
		borderL = baseL - 9;
	}
	else
	{
		// 亮 base (>=48): 目标约 22
		borderL = 22;
	}

	const border = colord({ h: baseH - 2, s: baseS * 0.75, l: borderL });

	return { text: text.toHex(), bg: bg.toHex(), border: border.toHex() };
}

export function contrastColor(baseHex: IColorInput)
{
	const base = colord(baseHex).toRgb();
	const r = base.r, g = base.g, b = base.b;
	return (((r*299)+(g*587)+(b*144))/1000) >= 131.5 ? 'black' as const : 'white' as const;
}

export function getSmartContrastColor2(baseHex: IColorInput) {
  const color = colord(baseHex);
  const { h, s, l } = color.toHsl();

  // 使用更精確的人眼感知亮度判斷 (WCAG 2.0 亮度公式)
  const isLight = color.isLight();

  if (isLight) {
    // 如果背景是淺色 -> 文字用該色相的「極深色」
    // 降低飽和度避免過於刺眼，亮度控制在 5-15%
    return colord({ h, s: s * 0.6, l: 10 });
  } else {
    // 如果背景是深色 -> 文字用該色相的「極淺色」
    // 稍微混合一點背景色相，亮度控制在 95-98%
    return colord({ h, s: s * 0.2, l: 96 });
  }
}

export function getLchContrastColor3(baseHex: IColorInput) {
  const color = colord(baseHex);
  const { l, c, h } = color.toLch();

  // Lab 的 L 範圍是 0-100，通常 60 以上視為淺色
  const isLight = l > 60;

  return colord({
    l: isLight ? 15 : 98, // 極深或極淺
    c: isLight ? c * 0.4 : c * 0.1, // 根據背景鮮豔度保留一點色彩
    h: h
  });
}

export function newTagColorsGenerator()
{
	const initialColors = paletteLazyHex.antdTags;
	// const generator = _createExhaustGenerator();

	const gen = loopColors(initialColors, {
		generator: (colors, position, idx) =>
		{
			const color = colord(colors[position]);

			if (idx < colors.length)
			{
				/** 第一輪：直接使用初始顏色 */
				return color;
			}
			else
			{
				/** 初始顏色用完了，開始產生變化 */
				return _createSimilarColor(color);
			}
		},
	})();

	return gen;
}

/**
 * 將 0-255 的 sRGB 通道轉換為線性空間值
 */
function sRGBToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * 實作 WCAG 2.0 相對亮度公式
 */
function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const R = sRGBToLinear(rgb.r);
  const G = sRGBToLinear(rgb.g);
  const B = sRGBToLinear(rgb.b);
  // WCAG 標準加權係數
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getAdvancedContrastColor4(baseInput: IColorInput) {
  const instance = colord(baseInput);
  const rgb = instance.toRgb();
  const hsl = instance.toHsl();

  // 1. 計算物理亮度 (Luminance)
  const luminance = getRelativeLuminance(rgb);

  // 2. 判斷是否為淺色背景 (依據 WCAG 標準，0.179 是常用的黑白分水嶺)
  // 你也可以根據視覺偏好微調此數值，例如 0.18 ~ 0.2
  const isLightBackground = luminance > 0.179;

  if (isLightBackground) {
    // 淺色背景 -> 生成「深色文字」
    // 策略：保留原色相，降低飽和度（避免刺眼），極低亮度（維持可讀性）
    return colord({
      h: hsl.h,
      s: hsl.s * 0.6, // 降低原飽和度至 60%
      l: 12,          // 亮度控制在 12% 左右，看起來像極深色而非純黑
      a: 1
    });
  } else {
    // 深色背景 -> 生成「淺色文字」
    // 策略：保留原色相，大幅降低飽和度，極高亮度
    return colord({
      h: hsl.h,
      s: hsl.s * 0.2, // 只需要一點點原色調，否則會變太鮮豔
      l: 97,           // 亮度 96% 看起來非常接近白色但更柔和
      a: 1
    });
  }
}

export function getAdvancedContrastColor5(baseInput: IColorInput) {
  const instance = colord(baseInput);
  const hsl = instance.toHsl();
  const isLightBackground = _getAdvancedContrastColor_isLight(instance);

  if (isLightBackground) {
    // 淺色背景 -> 生成「深色文字」
    // 策略：保留原色相，降低飽和度（避免刺眼），極低亮度（維持可讀性）
    return colord({
      h: hsl.h,
      s: hsl.s * 0.6, // 降低原飽和度至 60%
      l: 12,          // 亮度控制在 12% 左右，看起來像極深色而非純黑
      a: 1
    });
  } else {
    // 深色背景 -> 生成「淺色文字」
    // 策略：保留原色相，大幅降低飽和度，極高亮度
    return colord({
      h: hsl.h,
      s: Math.max(hsl.s, 10), // 只需要一點點原色調，否則會變太鮮豔
      l: 93,           // 亮度 96% 看起來非常接近白色但更柔和
      a: 1
    });
  }
}

export function getAdvancedContrastColor6(baseInput: IColorInput) {
  const instance = colord(baseInput);
  const hsl = instance.toHsl();
  const isLightBackground = _getAdvancedContrastColor_isLight(instance);

  console.log('isLightBackground', isLightBackground, hsl);

  if (isLightBackground) {
    // 淺色背景 -> 生成「深色文字」
    // 策略：保留原色相，降低飽和度（避免刺眼），極低亮度（維持可讀性）
    return colord({
      h: hsl.h,
      s: Math.max(hsl.s * 0.6, 90), // 降低原飽和度至 60%
      l: 13,          // 亮度控制在 12% 左右，看起來像極深色而非純黑
      a: 1
    });
  } else {
    // 深色背景 -> 生成「淺色文字」
    // 策略：保留原色相，大幅降低飽和度，極高亮度
    return colord({
      h: hsl.h,
      s: Math.max(hsl.s * 1.5, 60), // 只需要一點點原色調，否則會變太鮮豔
      l: 85,           // 亮度 96% 看起來非常接近白色但更柔和
      a: 1
    });
  }
}

export function _getAdvancedContrastColor_isLight(baseInput: IColorInput) {
  const instance = colord(baseInput);
  const rgb = instance.toRgb();

  /** 計算物理亮度 (Luminance) */
  const luminance = getRelativeLuminance(rgb);

  /**
	 * 判斷是否為淺色背景 (依據 WCAG 標準，0.179 是常用的黑白分水嶺)
	 * 你也可以根據視覺偏好微調此數值，例如 0.18 ~ 0.2
	 */
  const isLightBackground = luminance > 0.179;

  return isLightBackground
}
