/**
 * 型別輔助工具
 * Type helper utilities
 *
 * 提供資料集類型相關的泛型推導輔助型別
 * Provides generic inference helper types for dataset types
 */
import { EnumDatasetType, IDatasetEntry } from '@/lib/utils/grid/grid-types';

/**
 * 依照資料類型列舉建立對應的資料集條目映射
 * Create a typed record mapping dataset type keys to their entries
 *
 * @typeParam K - 資料類型列舉子集 / Subset of DatasetType enumeration
 */
export type IRecordTyped<K extends EnumDatasetType> = {
	[key in K]: IDatasetEntry<key>;
};

/**
 * 從資料集條目中推導出資料類型
 * Infer dataset type from dataset entry
 *
 * @typeParam T - 資料集條目型別 / Dataset entry type
 */
type IExtractInferKey<T> = T extends IDatasetEntry<infer K> ? K : never;

/**
 * 根據資料集條目型別建立對應的映射
 * Create a typed record mapping based on dataset entry type
 *
 * 從資料集條目型別中提取鍵值並建立對應的型別映射
 * Extracts keys from the dataset entry type and builds the corresponding type mapping
 *
 * @typeParam T - 資料集條目型別 / Dataset entry type
 */
export type IRecordTyped2<T> = {
  [P in IExtractInferKey<T>]: T extends IDatasetEntry<P> ? T : never;
};
