'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';

import L from 'leaflet';
import { Alert, Button, Card, Flex, Input, Layout, Select, Space, Switch, Tag, Typography, theme } from 'antd';
import {
	CompassOutlined,
	GlobalOutlined,
	LayoutOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	ReloadOutlined,
	SearchOutlined,
	ThunderboltOutlined,
	VerticalAlignBottomOutlined,
	WifiOutlined,
} from '@ant-design/icons';
import { IWiFiHotspot } from '@/types';
import { NOMINATIM_CONTACT_EMAIL } from '@/config/nominatim-config';
import MarkerClusterGroup from 'react-leaflet-cluster'

import "../styles/leaflet.scss";

import { MapTileLayer } from './map/MapTileLayer';
import { EnumDatasetType, IGeoCoord, IGeoPointTupleLatLng } from '@/lib/utils/grid/grid-types';
import { fetchOSMReverseInfo } from '@/lib/utils/api/fetch-api';
import { CircleMarkerSVG } from './map/icon/CircleMarkerSVG';
import { getAndFormatDistance } from '@/lib/utils/geo/geo-formatter';
import {
	wrapCoordinate,
	wrapCoordinateFromPointTupleLatLng,
	wrapPointTupleLatLngFromCoordinate,
} from '@/lib/utils/geo/geo-transform';
import { calculateDistance } from '@/lib/utils/geo/geo-math';
import { _createProximityComparator } from '@/lib/utils/geo/geo-sort.';
import { FloatButtonElement } from 'antd/es/float-button/FloatButton';
import {
	EnumGoogleMapsMode,
	generateGoogleMapsUrl,
	getAvailableGoogleMapsModes,
	getGoogleMapsModeDisplayName,
	openGoogleMaps,
} from '@/lib/utils/google-maps-url';
import { getGoogleMapsMode, setGoogleMapsMode as saveGoogleMapsMode } from '@/lib/utils/google-maps-settings';
import { IStationBase } from '@/types/station-base';
import { useFacilityPointBlocksData } from './facilityPoint/useFacilityPointBlocksData';
import { FacilityPointDataListAll } from './facilityPoint/FacilityPointDataList';
import { FacilityPointDataMarkerAll } from './facilityPoint/FacilityPointDataMarker';
import { BoundsRectangles } from './facilityPoint/BoundsRectangles';
import { IGeolocationResultWithMeta } from './map/map-btn/FloatGeolocationButton';
import { _generateColorPresetOutlined, contrastColor, getAdvancedContrastColor4, getAdvancedContrastColor5, getAdvancedContrastColor6, getLchContrastColor3, getSmartContrastColor2, newTagColorsGenerator } from '@/lib/utils/colors-utils';
import { ColoredSelect } from './input/ColoredSelect';
import { colord } from 'colord';

/**
 * 側邊欄展開寬度（像素）
 * Sidebar expanded width in pixels
 */
const SIDER_WIDTH = 320;

/**
 * 列表顯示位置儲存鍵
 * LocalStorage key for list display position
 */
const LIST_DISPLAY_MODE_KEY = 'wifi-map-list-display-mode';

/**
 * 列表顯示模式類型
 * List display mode type
 */
type IListDisplayMode = 'sidebar' | 'bottom';

/**
 * 從 localStorage 讀取列表顯示模式
 * Read list display mode from localStorage
 */
const getStoredListDisplayMode = (): IListDisplayMode | null =>
{
	if (typeof window === 'undefined') return null;
	try
	{
		const stored = localStorage.getItem(LIST_DISPLAY_MODE_KEY);
		if (stored === 'sidebar' || stored === 'bottom')
		{
			return stored;
		}
		// 無效值，清除
		localStorage.removeItem(LIST_DISPLAY_MODE_KEY);
		return null;
	}
	catch
	{
		return null;
	}
};

/**
 * 儲存列表顯示模式至 localStorage
 * Save list display mode to localStorage
 */
const setStoredListDisplayMode = (mode: IListDisplayMode): void =>
{
	if (typeof window === 'undefined') return;
	try
	{
		localStorage.setItem(LIST_DISPLAY_MODE_KEY, mode);
	}
	catch
	{
		// 忽略儲存錯誤
	}
};

/**
 * 地圖中心位置組件（僅響應位置變更，不響應縮放）
 * Map center location component (only responds to position changes, not zoom)
 */
function ChangeView({ center, shouldAutoCenter }: {
	center: IGeoPointTupleLatLng,
	zoom: number,
	shouldAutoCenter: boolean,
})
{
	const map = useMap();
	useEffect(() =>
	{
		/** 只有在需要自動置中時才移動地圖 */
		if (shouldAutoCenter)
		{
			console.log('[ChangeView] Setting view to:', center, undefined, { animate: true });
			map.setView(center, undefined, {
				animate: true,
				duration: 1.5,
				easeLinearity: 0.2,
			});
		}
	}, [center, map, shouldAutoCenter]);
	return null;
}

/**
 * 設施地圖組件
 * Facility map component
 */
export default function FacilityMap()
{
	/**
	 * 取得 antd 主題 Design Tokens
	 * Get antd theme Design Tokens
	 */
	const { token } = theme.useToken();

	/** 手動定位模式點擊地圖時設定位置 */
	const ManualLocationHandler = () =>
	{
		useMapEvents({
			click: (e) =>
			{
				if (manualMode)
				{
					setShouldAutoCenter(false); // 手動模式不自動置中
					setPosition(wrapPointTupleLatLngFromCoordinate(e.latlng));
					/** 保持目前的 zoom 等級，不改變 */
					setLocationError(false);
					setManualMode(false);
					updateAddress(e.latlng);
				}
			},
		});
		return null;
	};

	/** 篩選器狀態 / Filter state */
	const [filters, setFilters] = useState({
		wifi: true,
		charging: true,
		passwordOnly: false,
		searchTerm: '', // 熱點搜尋關鍵字
		selectedCategories: [] as string[], // 選擇的分類清單 / Selected categories
	});

	/** 右鍵點擊地圖移動定位點（預設開啟） / Right-click to move location marker */
	const [longPressToMove, setLongPressToMove] = useState(true);

	/** 是否顯示設施點邊界框線 / Whether to show facility point bounds rectangles */
	const [showBounds, setShowBounds] = useState(false); // 預設隱藏

	/** Google Maps 開啟模式 / Google Maps opening mode */
	const [mapMode, setMapMode] = useState<EnumGoogleMapsMode>(() => getGoogleMapsMode());
	const mapModeRef = useRef(mapMode);

	// 每次渲染時同步更新 ref
	useEffect(() =>
	{
		mapModeRef.current = mapMode;
	}, [mapMode]);

	/** 開啟 Google 地圖處理函式 */
	const handleOpenGoogleMaps = useCallback((item: IStationBase, isNavigation?: boolean) =>
	{
		const url = generateGoogleMapsUrl(item, {
			mode: mapModeRef.current,
			isNavigation,
		});
		openGoogleMaps(url);
	}, [mapMode]);

	/** 右鍵點擊地圖移動定位點 */
	const LongPressHandler = () =>
	{
		const map = useMap();

		useEffect(() =>
		{
			const handleContextMenu = (e: L.LeafletMouseEvent) =>
			{
				// 檢查功能是否啟用（使用 React state 而非 DOM 選擇器）
				if (!longPressToMove) return;

				// 右鍵點擊來移動定位點 - 不觸發自動置中
				e.originalEvent.preventDefault();
				setShouldAutoCenter(false); // 不自動置中
				setPosition(wrapPointTupleLatLngFromCoordinate(e.latlng));
				setLocationError(false);
				updateAddress(e.latlng);
			};

			map.on('contextmenu', handleContextMenu);

			return () =>
			{
				map.off('contextmenu', handleContextMenu);
			};
		}, [map, longPressToMove]);

		return null;
	};
	const [filteredHotspots, setFilteredHotspots] = useState<IWiFiHotspot[]>([]);

	/** 地圖中心座標 */
	const [mapCenter, setMapCenter] = useState<IGeoCoord | null>(null);
	const [position, setPosition] = useState<IGeoPointTupleLatLng>([25.0330, 121.5654]); // 預設台北 101
	const [zoom, setZoom] = useState(18); // 記錄目前縮放等級，會在置中前保存當前縮放
	/** 用於取得 Leaflet map 實例，以在需要時讀取當前 zoom 等級 */
	const mapRef = useRef<L.Map | null>(null);

	const facilityPoint = useFacilityPointBlocksData(mapCenter! as any);

	const [address, setAddress] = useState<string>(''); // 位置地址
	const [addressLoading, setAddressLoading] = useState<boolean>(false); // 地址查詢載入狀態
	const [locationError, setLocationError] = useState<boolean>(false);
	const [manualMode, setManualMode] = useState<boolean>(false);
	const [shouldAutoCenter, setShouldAutoCenter] = useState<boolean>(false); // 是否應該自動置中
	const [addressSearchTerm, setAddressSearchTerm] = useState<string>(''); // 地址搜尋關鍵字

	/**
	 * 側邊欄收合狀態 / Sidebar collapsed state
	 */
	const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

	/**
	 * 是否為移動裝置（由 Sider 斷點觸發）/ Is mobile device (triggered by Sider breakpoint)
	 */
	const [isMobile, setIsMobile] = useState<boolean>(false);

	/**
	 * 列表顯示位置模式 / List display position mode
	 */
	const [listDisplayMode, setListDisplayMode] = useState<IListDisplayMode>(() =>
	{
		// 初始值從 localStorage 讀取，預設為 sidebar
		return getStoredListDisplayMode() || 'sidebar';
	});


	/** 地址搜尋結果 / Address search results */
	const [addressSearchResults, setAddressSearchResults] = useState<{
		lat: string,
		lon: string,
		display_name: string
	}[]>([]);

	/** 顯示的熱點數量（分頁用）/ Number of visible hotspots (for pagination) */
	const [visibleHotspotCount, setVisibleHotspotCount] = useState(20);

	/** 手動設定後，同步更新地址 */
	const updateAddress = async (coord: IGeoCoord) =>
	{
		return;

		setAddressLoading(true);

		await fetchOSMReverseInfo(coord)
			.then(data =>
			{
				setAddress(data.display_name || '');
			})
			.catch(() =>
			{
				setAddress('');
			})
			.finally(() =>
			{
				setAddressLoading(false);
			})
		;
	};

	/** 搜尋計時器 ref */
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	/** 防止重複搜尋的標記 */
	const isSearchingRef = useRef<boolean>(false);

	/** 透過地址關鍵字搜尋位置（正向地理編碼）- 即時搜尋（防抖） */
	const handleAddressSearch = useCallback((term: string) =>
	{
		console.log('🔍 handleAddressSearch called with term:', term);

		// 防止重複搜尋
		if (isSearchingRef.current)
		{
			console.log('⚠️ Already searching, skipping duplicate call');
			return;
		}

		setAddressSearchTerm(term);

		// 清除之前的計時器
		if (searchTimerRef.current)
		{
			console.log('⏰ Clearing previous search timer');
			clearTimeout(searchTimerRef.current);
		}

		if (!term.trim() || term.length < 2)
		{
			console.log('🚫 Search term too short or empty, clearing results');
			setAddressSearchResults([]);
			return;
		}

		console.log('⏳ Setting new search timer (300ms delay)');
		// 延遲 300ms 後再搜尋，避免快速輸入觸發過多請求
		searchTimerRef.current = setTimeout(async () =>
		{
			if (isSearchingRef.current)
			{
				console.log('⚠️ Search already in progress, skipping');
				return;
			}

			isSearchingRef.current = true;
			console.log('🚀 Executing search for term:', term);

			try
			{
				// 優先搜尋台灣，增加結果數量
				console.log('🇹🇼 Searching Taiwan for:', term);
				const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(term)}&countrycodes=tw&limit=20&addressdetails=1`, {
					headers: {
						'User-Agent': `WiFi-Free-Map/1.0 (${NOMINATIM_CONTACT_EMAIL})`,
					},
				});
				const data = await res.json();
				console.log('🇹🇼 Taiwan search results count:', data?.length || 0);

				// 如果台灣沒結果，搜尋全球
				if (!data || data.length === 0)
				{
					console.log('🌍 No Taiwan results, searching globally for:', term);
					const globalRes = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(term)}&limit=20&addressdetails=1`, {
						headers: {
							'User-Agent': `WiFi-Free-Map/1.0 (${NOMINATIM_CONTACT_EMAIL})`,
						},
					});
					const globalData = await globalRes.json();
					console.log('🌍 Global search results count:', globalData?.length || 0);
					setAddressSearchResults(globalData || []);
				}
				else
				{
					// 優化搜尋結果：增加捷運站、地標的權重
					console.log('📍 Optimizing search results with priority for stations and landmarks');
					const results = data as {
						lat: string,
						lon: string,
						display_name: string,
						importance?: number,
						type?: string
					}[];

					// 計算加權分數
					const enhancedResults = results.map(result =>
					{
						let score = result.importance || 1;
						const displayName = result.display_name.toLowerCase();

						// 增加捷運站、地鐵站的權重
						if (displayName.includes('捷運') || displayName.includes('地鐵') || displayName.includes('mrt') || displayName.includes('subway'))
						{
							score += 10;
						}
						// 增加車站的權重
						if (displayName.includes('車站') || displayName.includes('station'))
						{
							score += 8;
						}
						// 增加地標、景點的權重
						if (displayName.includes('寺') || displayName.includes('廟') || displayName.includes('山') ||
							displayName.includes('公園') || displayName.includes('市場') || displayName.includes('商圈'))
						{
							score += 5;
						}
						// 增加學校、醫院的權重
						if (displayName.includes('學校') || displayName.includes('大學') || displayName.includes('醫院') || displayName.includes('診所'))
						{
							score += 4;
						}
						// 增加商場、購物中心的權重
						if (displayName.includes('商場') || displayName.includes('購物') || displayName.includes('mall'))
						{
							score += 3;
						}

						return { ...result, score };
					});

					// 按權重和距離排序
					if (position)
					{
						const from = wrapCoordinateFromPointTupleLatLng(position);

						enhancedResults.sort((a, b) =>
						{
							const distA = calculateDistance(from, wrapCoordinate(parseFloat(a.lon), parseFloat(a.lat)));
							const distB = calculateDistance(from, wrapCoordinate(parseFloat(b.lon), parseFloat(b.lat)));

							// 先按權重排序，再按距離排序
							const weightDiff = b.score - a.score;
							if (weightDiff !== 0)
							{
								return weightDiff;
							}
							return distA - distB;
						});
					}
					else
					{
						// 沒有位置資訊時，只按權重排序
						enhancedResults.sort((a, b) => b.score - a.score);
					}

					// 移除臨時的 score 欄位
					const finalResults = enhancedResults.map(({ score, ...rest }) => rest);
					console.log('✅ Enhanced search results, count:', finalResults.length);
					console.log('🎯 Top result:', finalResults[0]?.display_name);
					setAddressSearchResults(finalResults);
				}
			}
			catch (error)
			{
				console.error('❌ Address search failed:', error);
				setAddressSearchResults([]);
			}
			finally
			{
				searchTimerRef.current = null;
				isSearchingRef.current = false;
				console.log('✅ Search completed, timer reset');
			}
		}, 300);
	}, [position]);

	/** 選擇搜尋結果 */
	const selectAddressResult = (result: { lat: string, lon: string, display_name: string }) =>
	{
		const lat = parseFloat(result.lat);
		const lng = parseFloat(result.lon);

		setShouldAutoCenter(false);
		setPosition(wrapPointTupleLatLngFromCoordinate({ lat, lng }));
		setAddress(result.display_name);
		setAddressSearchTerm('');
		setAddressSearchResults([]);
	};


	/** 依據搜尋、密碼、分類過濾 WiFi 熱點 */
	useEffect(() =>
	{
		/** 先複製陣列避免原地修改 */
		let filtered = [...(facilityPoint.data?.wifi ?? [])].filter((hotspot) =>
		{
			/** 關鍵字過濾：名稱或 SSID 包含搜尋字串（不分大小寫） */
			const term = filters.searchTerm.trim().toLowerCase();
			if (term)
			{
				const nameMatch = hotspot.name?.toLowerCase().includes(term);
				const ssidMatch = hotspot.ssid?.toLowerCase().includes(term);
				if (!nameMatch && !ssidMatch) return false;
			}
			// 密碼過濾
			if (filters.passwordOnly && !hotspot.password) return false;

			// 分類過濾：如果選擇了分類，則只顯示符合選擇分類的熱點
			if (filters.selectedCategories.length > 0)
			{
				// 如果熱點沒有分類，且有用戶選擇分類，則過濾掉
				if (!hotspot.category) return false;
				// 檢查熱點的分類是否在選擇的分類清單中
				if (!filters.selectedCategories.includes(hotspot.category)) return false;
			}

			return true;
		});

		console.log('[filteredHotspots] hotspots:', facilityPoint.data?.wifi.length,
			'\nmapCenter:', mapCenter,
			'\nposition:', position && wrapCoordinateFromPointTupleLatLng(position),
			'\nfiltered.length:', filtered.length,
			'\nfiltered(0, 5):', filtered.slice(0, 5),
			'\nfiltered(-5):', filtered.slice(-5),
		);

		setFilteredHotspots(filtered);

	}, [facilityPoint.data, filters]);

	/** 建立一個持久的顏色倉庫 */
	const colorCacheRef = useRef<Map<string, any>>(new Map());
	/** 建立顏色生成器 (確保生成器也是持久的，或每次重新生成時略過已使用的顏色) */
  const colorGenRef = useRef(newTagColorsGenerator());

	const tagCategories = useMemo(() =>
	{
		const gen = colorGenRef.current;

		const cache = colorCacheRef.current;

		const bool = (!filters.selectedCategories?.length) ? true : null;

		const allCategories = Array.from(new Set([...cache.keys(), ...facilityPoint.categories]));

		console.log('tagCategories', bool, filters.selectedCategories, allCategories);

		return allCategories.map((category) =>
		{
			let cacheValue = cache.get(category)!;

			if (!cache.has(category))
			{
				const color = gen.next().value!;

				const text2 = contrastColor(color);

				let text3 = color;

				if (text2 === 'white')
				{
					let hsl = text3.toHsl();
					hsl.l = Math.min(1, hsl.l + 0.25);
					text3 = colord(hsl);
				}
				else
				{
					let hsl = text3.toHsl();
					hsl.l = Math.max(0, hsl.l - 0.25);
					text3 = colord(hsl);
				}

				let text4 = color.mix(text2, 0.9);
				let text5 = color.invert();

				let text6 = getSmartContrastColor2(color);
				let text7 = getLchContrastColor3(color);
				let text8 = getAdvancedContrastColor4(color);
				let text9 = getAdvancedContrastColor5(color);
				let text10 = getAdvancedContrastColor6(color);

				const colorPreset = {
					..._generateColorPresetOutlined(color),
					text2,
					text3,
					text4,
					text5,
					text6,
					text7,
					text8,
					text9,
					text10,
				};

				console.log(category, color, color.isDark(), text2, colorPreset);

				cache.set(category, cacheValue = {
					color: color.toHex(),
					colorPreset,
				});
			}

			return {
				value: category,
				label: category,
				color: cacheValue!.color,
				colorPreset: cacheValue!.colorPreset,
				visible: bool || filters.selectedCategories.includes(category) || null,
			};
		});

	}, [facilityPoint.categories, filters.selectedCategories]);

	/** 依據分類過濾充電站 */
	const filteredChargingStations = useMemo(() =>
	{
		let filtered = [...(facilityPoint.data?.charging ?? [])];

		// 分類過濾：如果選擇了分類，則只顯示符合選擇分類的充電站
		if (filters.selectedCategories.length > 0)
		{
			filtered = filtered.filter((station) =>
			{
				// 如果充電站沒有分類，且有用戶選擇分類，則過濾掉
				if (!station.category) return false;
				// 檢查充電站的分類是否在選擇的分類清單中
				return filters.selectedCategories.includes(station.category);
			});
		}

		return filtered;
	}, [facilityPoint.data, filters.selectedCategories]);

	const facilityPointFilteredData = useMemo(() => {
		return {
			...facilityPoint.data,
			[EnumDatasetType.WIFI]: filteredHotspots,
			[EnumDatasetType.CHARGING]: filteredChargingStations,
		}
	}, [filteredHotspots, filteredChargingStations]);

	// 處理列表項目點擊 - 連動地圖
	const handleListItemClick = (hotspot: IWiFiHotspot) =>
	{
		setShouldAutoCenter(true);
		setPosition(wrapPointTupleLatLngFromCoordinate(hotspot));
		setZoom(16); // 放大到能看到詳細資訊的等級
	};

	const floatGeoRef = useRef<FloatButtonElement | null>(null);

	/**
	 * 處理側邊欄收合狀態變更 / Handle sidebar collapsed state change
	 */
	const handleSidebarCollapse = (collapsed: boolean) =>
	{
		setSidebarCollapsed(collapsed);
	};

	/**
	 * 處理響應式斷點觸發 / Handle responsive breakpoint trigger
	 */
	const handleBreakpoint = (broken: boolean) =>
	{
		setIsMobile(broken);
		// 當進入移動裝置模式時自動收合，離開時自動展開
		if (broken)
		{
			setSidebarCollapsed(true);
		}
		else
		{
			setSidebarCollapsed(false);
		}
	};

	/**
	 * 切換列表顯示位置 / Toggle list display position
	 */
	const toggleListDisplayMode = useCallback(() =>
	{
		const newMode: IListDisplayMode = listDisplayMode === 'sidebar' ? 'bottom' : 'sidebar';
		setListDisplayMode(newMode);
		setStoredListDisplayMode(newMode);
		/**
		 * 當切換至側邊欄模式時，自動展開側邊欄
		 * Auto expand sidebar when switching to sidebar mode
		 */
		if (newMode === 'sidebar')
		{
			setSidebarCollapsed(false);
		}
	}, [listDisplayMode]);

	/**
	 * 取得實際使用的列表顯示模式 / Get effective list display mode
	 */
	const effectiveListDisplayMode: IListDisplayMode = listDisplayMode;

	/**
	 * 側邊欄搜尋與過濾面板內容 / Sidebar search and filter panel content
	 */
	const SidebarContent = () => (
		<Flex vertical gap="middle" style={{ padding: '12px', height: '100%', overflowY: 'auto' }}>
			{/* 側邊欄標題、切換按鈕與收合按鈕 / Sidebar header, toggle button and collapse button */}
			<Flex justify="space-between" align="center">
				<Typography.Title level={5} style={{ margin: 0 }}>
					搜尋與過濾
				</Typography.Title>
				<Flex gap="small">
					{/* 列表位置切換按鈕 / List position toggle button */}
					<Button
						type="text"
						icon={effectiveListDisplayMode === 'sidebar' ? <VerticalAlignBottomOutlined /> : <LayoutOutlined />}
						onClick={toggleListDisplayMode}
						size="small"
						title={effectiveListDisplayMode === 'sidebar' ? '切換至底部顯示列表' : '切換至側邊欄顯示列表'}
					/>
					<Button
						type="text"
						icon={<MenuFoldOutlined />}
						onClick={() => setSidebarCollapsed(true)}
						size="small"
						title="收合側邊欄"
					/>
				</Flex>
			</Flex>
			{/* 搜尋與過濾 / Search and Filter */}
			<Card size="small" hoverable title="搜尋與過濾">
				<Flex vertical gap="middle">
					<Input
						placeholder="搜尋熱點或 SSID..."
						prefix={<SearchOutlined />}
						value={filters.searchTerm}
						onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
					/>
					{/* 分類多選 / Category multi-select */}
					{facilityPoint.categories && facilityPoint.categories.length > 0 && (
						<Flex vertical gap="small">
							<Typography.Text type="secondary">依分類過濾 / Filter by Category</Typography.Text>
							<ColoredSelect
								placeholder="選擇分類..."

								onChange={(values) => setFilters({ ...filters, selectedCategories: values })}
								style={{ width: '100%' }}

								value={filters.selectedCategories}
								options={tagCategories}
							/>
						</Flex>
					)}
					<Flex gap="middle" wrap>
						<Flex align="center" gap="small">
							<WifiOutlined style={{ color: '#1890ff' }} />
							<Typography.Text>WiFi</Typography.Text>
							<Switch
								checked={filters.wifi}
								onChange={(checked) => setFilters({ ...filters, wifi: checked })}
								size="small"
							/>
						</Flex>
						<Flex align="center" gap="small">
							<ThunderboltOutlined style={{ color: '#fa8c16' }} />
							<Typography.Text>充電</Typography.Text>
							<Switch
								checked={filters.charging}
								onChange={(checked) => setFilters({ ...filters, charging: checked })}
								size="small"
							/>
						</Flex>
						<Flex align="center" gap="small">
							<Typography.Text>只顯示有密碼</Typography.Text>
							<Switch
								checked={filters.passwordOnly}
								onChange={(checked) => setFilters({ ...filters, passwordOnly: checked })}
								size="small"
							/>
						</Flex>
					</Flex>
				</Flex>
			</Card>

			{/* 其他選項 / Other Options */}
			<Card size="small" hoverable title="其他選項">
				<Flex gap="middle" wrap>
					<Flex align="center" gap="small">
						<Switch
							checked={longPressToMove}
							onChange={(checked) => setLongPressToMove(checked)}
							size="small"
						/>
						<Typography.Text>右鍵點擊移動定位點</Typography.Text>
					</Flex>
					<Flex align="center" gap="small">
						<Typography.Text>Google 地圖：</Typography.Text>
						<Select
							value={mapMode}
							onChange={(value) =>
							{
								setMapMode(value);
								saveGoogleMapsMode(value); // 儲存到 localStorage
							}}
							style={{ width: 140 }}
							size="small"
							options={getAvailableGoogleMapsModes().map(mode => ({
								value: mode,
								label: getGoogleMapsModeDisplayName(mode),
							}))}
						/>
					</Flex>
					<Flex align="center" gap="small">
						<Switch
							checked={showBounds}
							onChange={(checked) => setShowBounds(checked)}
							size="small"
						/>
						<Typography.Text>顯示邊界框線</Typography.Text>
					</Flex>
				</Flex>
			</Card>

			{/* 類別標籤 / Category tags */}
			<Flex gap="small" align="center" wrap>
				{tagCategories.map((category, idx) => {
					return (
						<Tag
							key={category.value}
							color={category.color}
							variant={'solid'}
							style={{
								color: category.colorPreset.text10.toRgbString(),
								opacity: category.visible ? 1 : 0.3,
							}}
						>
							{category.label ?? category.value}
						</Tag>
					)
				})}
			</Flex>

			{/* 設施點列表（僅在側邊欄模式下顯示）/ Facility point list (only in sidebar mode) */}
			{effectiveListDisplayMode === 'sidebar' && (
				<FacilityPointDataListAll
					data={facilityPointFilteredData}
					onClick={handleListItemClick}
					onOpenMap={handleOpenGoogleMaps}
					position={position}
					mapCenter={mapCenter!}
				/>
			)}
		</Flex>
	);

	/**
	 * 底部列表面板內容 / Bottom list panel content
	 */
	const BottomListPanel = () => (
		<Flex
			vertical
			style={{
				height: 280,
				background: token.colorBgContainer,
				borderTop: `1px solid ${token.colorBorderSecondary}`,
				overflow: 'hidden',
			}}
		>
			{/* 底部面板標題列 / Bottom panel header */}
			<Flex
				justify="space-between"
				align="center"
				style={{
					padding: '12px 16px',
					borderBottom: `1px solid ${token.colorBorderSecondary}`,
					background: token.colorBgElevated,
				}}
		>
				<Typography.Title level={5} style={{ margin: 0 }}>
					附近設施點
				</Typography.Title>
				<Button
					type="text"
					icon={<LayoutOutlined />}
					onClick={toggleListDisplayMode}
					size="small"
					title="切換至側邊欄顯示列表"
				>
					切換至側邊欄
				</Button>
			</Flex>
			{/* 底部列表面板 / Bottom list */}
			<div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
				<FacilityPointDataListAll
					data={facilityPointFilteredData}
					onClick={handleListItemClick}
					onOpenMap={handleOpenGoogleMaps}
					position={position}
					mapCenter={mapCenter!}
				/>
			</div>
		</Flex>
	);

	/**
	 * 地圖包裝容器
	 * Map wrapper container
	 */
	return (
		<Layout style={{ height: '100vh', width: '100vw' }}>
			{/* 頂部資訊列 / Top info bar */}
			<Layout.Header style={{ padding: '0 16px', height: 'auto', lineHeight: 'normal' }}>
				<Flex vertical gap="small" style={{ padding: '8px 0' }}>
					{/* 位置錯誤提示與手動定位按鈕 */}
					{locationError && (
						<Alert
							message="定位失敗，請允許 GPS 或手動設定位置。"
							action={
								<Space>
									<Button size="small" onClick={() => setManualMode(true)}>手動定位</Button>
									<Button size="small" icon={<ReloadOutlined />}
									        onClick={() => floatGeoRef.current?.click()}>重新請求定位</Button>
								</Space>
							}
							type="error"
							style={{ marginBottom: 8 }}
						/>
					)}
					{/* 座標與地址資訊 */}
					<Flex gap="middle" wrap justify="space-between">
						<Flex gap="middle" wrap>
							{address && <Typography.Text>地址: {address}</Typography.Text>}
							{addressLoading && <Typography.Text type="secondary">（查詢地址中...）</Typography.Text>}
						</Flex>
						<Flex gap="middle" wrap>
							{position && (
								<Typography.Text>
									座標: {position[0].toFixed(6)}, {position[1].toFixed(6)}
								</Typography.Text>
							)}
							<Typography.Text type="secondary">縮放: {zoom}</Typography.Text>
						</Flex>
					</Flex>
				</Flex>
			</Layout.Header>

			{/* 主內容區：側邊欄 + 地圖（+ 底部列表面板）/ Main content: Sidebar + Map (+ Bottom list panel) */}
			<Layout style={{ flex: 1, overflow: 'hidden' }}>
				{/* 左側可收合面板 / Left collapsible sidebar */}
				<Layout.Sider
					width={SIDER_WIDTH}
					collapsed={sidebarCollapsed}
					onCollapse={handleSidebarCollapse}
					breakpoint="md"
					onBreakpoint={handleBreakpoint}
					collapsedWidth={0}
					style={{
						background: token.colorBgContainer,
						borderRight: `1px solid ${token.colorBorderSecondary}`,
						display: sidebarCollapsed ? 'none' : 'flex',
						flexDirection: 'column',
					}}
				>
					<SidebarContent />
				</Layout.Sider>

				{/* 地圖區域 + 底部列表面板（條件渲染）/ Map area + Bottom list panel (conditional) */}
				{effectiveListDisplayMode === 'sidebar' ? (
					/* 側邊欄模式：僅地圖區域 */
					<Layout.Content style={{ position: 'relative', overflow: 'hidden' }}>
						{/* 側邊欄展開按鈕（當收合時顯示）/ Sidebar expand button (shown when collapsed) */}
						{sidebarCollapsed && (
							<Button
								type="primary"
								icon={<MenuUnfoldOutlined />}
								onClick={() => setSidebarCollapsed(false)}
								style={{
									position: 'absolute',
									top: 16,
									left: 16,
									zIndex: 1001,
								}}
								title="展開側邊欄"
							>
								搜尋
							</Button>
						)}

						{/* 地址搜尋浮動面板 / Address search floating panel */}
						<div style={{
							position: 'absolute',
							top: sidebarCollapsed ? 64 : 16,
							left: 16,
							right: 16,
							zIndex: 1000,
							maxWidth: 400,
						}}>
						<Input
							placeholder="輸入地址搜尋..."
							value={addressSearchTerm}
							onChange={(e) => handleAddressSearch(e.target.value)}
							style={{ width: '100%' }}
						/>
						{/* 搜尋結果下拉選單 */}
						{addressSearchResults.length > 0 && (
							<Card style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
								<Flex component="div" vertical gap="zero">
									{addressSearchResults.map((result, index) => (
										<Flex
											component="div"
											key={index}
											style={{ cursor: 'pointer', padding: '8px 12px' }}
											onClick={() => selectAddressResult(result)}
										>
											{result.display_name}
										</Flex>
									))}
								</Flex>
							</Card>
						)}
					</div>

					{/* 地圖容器 / Map container */}
					<div style={{ height: '100%', width: '100%' }}>
						<MapTileLayer
							center={position}
							zoom={zoom}
							style={{ height: '100%', width: '100%' }}
							doubleClickZoom={false}
							mapRef={mapRef}
							setZoom={setZoom}
							onMapCenterChange={setMapCenter}
							floatGeoProps={{
								btnRef: floatGeoRef,
								autoRequestGeolocation: true,
								onRequestGeolocation(result: IGeolocationResultWithMeta)
								{
									/** 標記需要自動置中 */
									setShouldAutoCenter(true);
									setPosition(wrapPointTupleLatLngFromCoordinate(result.coord));
									setLocationError(false);
									/** 反向地理編碼取得地址 */
									updateAddress(result.coord);
								},
								onError(error: any)
								{
									setLocationError(true);
								},
							}}
						>
							<CircleMarkerSVG
								position={position}
								color={'#c70eeb'}
								fillOpacity={0.5}
								eventHandlers={{
									dragend: (e) =>
									{
										const latlng = e.target.getLatLng() as IGeoCoord;
										/** 拖曳定位點後，不自動置中（打斷瀏覽體驗） */
										setShouldAutoCenter(false);
										setPosition(wrapPointTupleLatLngFromCoordinate(latlng));
										setLocationError(false);
										/** 更新拖曳後的地址 */
										updateAddress(latlng);
									},
								}}
							/>
							{/* 手動定位點擊監聽 */}
							<ManualLocationHandler />
							{/* 右鍵點擊移動定位點 */}
							<LongPressHandler />
							<FacilityPointDataMarkerAll
								data={facilityPointFilteredData}
								onOpenMap={handleOpenGoogleMaps}
							/>
							{/**
								 * 設施點範圍邊界框線
								 * Facility point range bounds rectangles
								 */}
							<BoundsRectangles
								matchedRangeBounds={facilityPoint.matchedRangeBounds!}
								triggerThresholdRangeBounds={facilityPoint.triggerThresholdRangeBounds!}
								blockScanRangeBounds={facilityPoint.blockScanRangeBounds!}
								mapCenter={mapCenter!}
								visible={showBounds}
							/>
							{/**
								 * 變更視角 - 當位置改變時自動置中
								 * Change view - auto center when position changes
								 */}
							<ChangeView center={position} zoom={zoom} shouldAutoCenter={shouldAutoCenter} />
						</MapTileLayer>
					</div>
				</Layout.Content>
			) : (
				/* 底部面板模式：地圖 + 底部列表面板 */
				<Layout style={{ flex: 1, overflow: 'hidden' }}>
					{/* 地圖區域（上方）/ Map area (top) */}
					<Layout.Content style={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
						{/* 側邊欄展開按鈕（當收合時顯示）/ Sidebar expand button (shown when collapsed) */}
						{sidebarCollapsed && (
							<Button
								type="primary"
								icon={<MenuUnfoldOutlined />}
								onClick={() => setSidebarCollapsed(false)}
								style={{
									position: 'absolute',
									top: 16,
									left: 16,
									zIndex: 1001,
								}}
								title="展開側邊欄"
							>
								搜尋
							</Button>
						)}

						{/* 地址搜尋浮動面板 / Address search floating panel */}
						<div style={{
							position: 'absolute',
							top: sidebarCollapsed ? 64 : 16,
							left: 16,
							right: 16,
							zIndex: 1000,
							maxWidth: 400,
						}}>
							<Input
								placeholder="輸入地址搜尋..."
								value={addressSearchTerm}
								onChange={(e) => handleAddressSearch(e.target.value)}
								style={{ width: '100%' }}
							/>
							{addressSearchResults.length > 0 && (
								<Card style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									<Flex component="div" vertical gap="zero">
										{addressSearchResults.map((result, index) => (
											<Flex
												component="div"
												key={index}
												style={{ cursor: 'pointer', padding: '8px 12px' }}
												onClick={() => selectAddressResult(result)}
											>
												{result.display_name}
											</Flex>
										))}
									</Flex>
								</Card>
							)}
						</div>

						{/* 地圖容器 / Map container */}
						<div style={{ height: '100%', width: '100%' }}>
							<MapTileLayer
								center={position}
								zoom={zoom}
								style={{ height: '100%', width: '100%' }}
								doubleClickZoom={false}
								mapRef={mapRef}
								setZoom={setZoom}
								onMapCenterChange={setMapCenter}
								floatGeoProps={{
									btnRef: floatGeoRef,
									autoRequestGeolocation: true,
									onRequestGeolocation(result: IGeolocationResultWithMeta)
									{
										setShouldAutoCenter(true);
										setPosition(wrapPointTupleLatLngFromCoordinate(result.coord));
										setLocationError(false);
										updateAddress(result.coord);
									},
									onError(error: Error)
									{
										setLocationError(true);
									},
								}}
							>
								<CircleMarkerSVG
									position={position}
									color={'#c70eeb'}
									fillOpacity={0.5}
									eventHandlers={{
										dragend: (e) =>
										{
											const latlng = e.target.getLatLng() as IGeoCoord;
											setShouldAutoCenter(false);
											setPosition(wrapPointTupleLatLngFromCoordinate(latlng));
											setLocationError(false);
											updateAddress(latlng);
										},
									}}
								/>
								<ManualLocationHandler />
								<LongPressHandler />
								<FacilityPointDataMarkerAll
									data={facilityPointFilteredData}
									onOpenMap={handleOpenGoogleMaps}
								/>
								<BoundsRectangles
									matchedRangeBounds={facilityPoint.matchedRangeBounds!}
									triggerThresholdRangeBounds={facilityPoint.triggerThresholdRangeBounds!}
									blockScanRangeBounds={facilityPoint.blockScanRangeBounds!}
									mapCenter={mapCenter!}
									visible={showBounds}
								/>
								<ChangeView center={position} zoom={zoom} shouldAutoCenter={shouldAutoCenter} />
							</MapTileLayer>
						</div>
					</Layout.Content>

					{/* 底部列表面板 / Bottom list panel */}
					<BottomListPanel />
				</Layout>
			)}
		</Layout>
	</Layout>
);
}
