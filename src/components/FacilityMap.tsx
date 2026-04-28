'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';

import L from 'leaflet';
import { Alert, Button, Card, Flex, Input, Layout, Select, Space, Splitter, Switch, Tag, Typography } from 'antd';
import {
	CompassOutlined,
	GlobalOutlined,
	ReloadOutlined,
	SearchOutlined,
	ThunderboltOutlined,
	WifiOutlined,
} from '@ant-design/icons';
import { IWiFiHotspot } from '@/types';
import { NOMINATIM_CONTACT_EMAIL } from '@/config/nominatim-config';
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
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
	const [initedReady, setInitedReady] = useState(false);

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
		longPressToMove: true, // 右鍵點擊地圖移動定位點（預設開啟）
	});

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
				if (!filters.longPressToMove) return;

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
		}, [map, filters.longPressToMove]);

		return null;
	};
	const [filteredHotspots, setFilteredHotspots] = useState<IWiFiHotspot[]>([]);

	/** 地圖中心座標 */
	const [mapCenter, setMapCenter] = useState<IGeoCoord | null>(null);
	const [position, setPosition] = useState<IGeoPointTupleLatLng>([25.0330, 121.5654]); // 預設台北 101
	const [zoom, setZoom] = useState(18); // 記錄目前縮放等級，會在置中前保存當前縮放
	/** 用於取得 Leaflet map 實例，以在需要時讀取當前 zoom 等級 */
	const mapRef = useRef<L.Map | null>(null);

	const { facilityPointData } = useFacilityPointBlocksData(initedReady && mapCenter! as any);

	const [address, setAddress] = useState<string>(''); // 位置地址
	const [addressLoading, setAddressLoading] = useState<boolean>(false); // 地址查詢載入狀態
	const [locationError, setLocationError] = useState<boolean>(false);
	const [manualMode, setManualMode] = useState<boolean>(false);
	const [shouldAutoCenter, setShouldAutoCenter] = useState<boolean>(false); // 是否應該自動置中
	const [addressSearchTerm, setAddressSearchTerm] = useState<string>(''); // 地址搜尋關鍵字

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

	/** 搜尋關鍵字 */
	const [searchTerm, setSearchTerm] = useState('');

	/** 依據搜尋、密碼、距離過濾熱點 */
	useEffect(() =>
	{
		/** 優先使用定位點排序，否則使用地圖中心 */
		const from: IGeoCoord = mapCenter || (position && wrapCoordinateFromPointTupleLatLng(position));

		/** 先複製陣列避免原地修改 */
		let filtered = [...(facilityPointData?.wifi ?? [])].filter((hotspot) =>
		{
			/** 關鍵字過濾：名稱或 SSID 包含搜尋字串（不分大小寫） */
			const term = searchTerm.trim().toLowerCase();
			if (term)
			{
				const nameMatch = hotspot.name?.toLowerCase().includes(term);
				const ssidMatch = hotspot.ssid?.toLowerCase().includes(term);
				if (!nameMatch && !ssidMatch) return false;
			}
			// 密碼過濾
			if (filters.passwordOnly && !hotspot.password) return false;

			return true;
		});

		filtered = filtered.sort(_createProximityComparator(from, calculateDistance));

		console.log('[filteredHotspots] hotspots:', facilityPointData?.wifi.length,
			'\nmapCenter:', mapCenter,
			'\nposition:', position && wrapCoordinateFromPointTupleLatLng(position),
			'\nfrom:', from,
			'\nfiltered.length:', filtered.length,
			'\nfiltered(0, 5):', filtered.slice(0, 5),
			'\nfiltered(-5):', filtered.slice(-5),
		);

		setFilteredHotspots(filtered);

	}, [facilityPointData, searchTerm, filters, mapCenter]);

	// 處理列表項目點擊 - 連動地圖
	const handleListItemClick = (hotspot: IWiFiHotspot) =>
	{
		setShouldAutoCenter(true);
		setPosition(wrapPointTupleLatLngFromCoordinate(hotspot));
		setZoom(16); // 放大到能看到詳細資訊的等級
	};

	const floatGeoRef = useRef<FloatButtonElement | null>(null);

	/**
	 * 地圖包裝容器
	 * Map wrapper container
	 */
	return (
		<>
		<Layout>
<Flex vertical>
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
					/>
				)}
				{/* 座標與地址資訊（保留在上方） */}
				<Flex vertical>
					<Flex gap="middle" wrap>
						{address && <Typography.Text>地址: {address}</Typography.Text>}
						{addressLoading && <Typography.Text type="secondary">（查詢地址中...）</Typography.Text>}
					</Flex>
					<Flex gap="middle" wrap>
						{position && (
							<Typography.Text>
								座標: {position[0]}, {position[1]}
							</Typography.Text>
						)}
						<Typography.Text>縮放: {zoom}</Typography.Text>
					</Flex>
				</Flex>
				{/* 地址搜尋表單 */}

					<Input
						placeholder="輸入地址搜尋..."
						value={addressSearchTerm}
						onChange={(e) => handleAddressSearch(e.target.value)}
						style={{ width: '100%' }}
					/>
					{/* 搜尋結果下拉選單 */}
					{addressSearchResults.length > 0 && (
						<Card style={{ position: 'absolute', zIndex: 1000, width: '100%', maxHeight: '300px', overflow: 'auto' }}>
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

				</Flex>
		</Layout>

				{/* 地圖容器 */}
				<Splitter vertical>
					<Splitter.Panel style={{ minHeight: 500 }} min={500}>
						<div style={{ minHeight: 500, height: '100%', width: '100%' }}>
							<MapTileLayer
								center={position}
								zoom={zoom}
								style={{ height: '100%', width: '100%', minHeight: 500 }}
								doubleClickZoom={false}

								mapRef={mapRef}
								setZoom={setZoom}

								onMapCenterChange={setMapCenter}

								floatGeoProps={{
									btnRef: floatGeoRef,
									autoRequestGeolocation: true,
									onRequestGeolocation(result)
									{

										/** 標記需要自動置中 */
										setShouldAutoCenter(true);
										setPosition(wrapPointTupleLatLngFromCoordinate(result.coord));

										const currentZoom = mapRef.current?.getZoom();

										/** 若外部提供保留的 zoom，則使用它；若未提供則保持目前 zoom */
										if (typeof currentZoom === 'number')
										{
											//setZoom(currentZoom);
										}

										setInitedReady(true);

										setLocationError(false);
										/** 反向地理編碼取得地址 */

										updateAddress(result.coord);
									},
									onError(error)
									{
										setInitedReady(true);
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
											// Preserve current zoom level; do not modify zoom
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
									data={{
										...facilityPointData,
										[EnumDatasetType.WIFI]: filteredHotspots,
									}}
									onOpenMap={handleOpenGoogleMaps}
								/>
								{/* 變更視角 - 當位置改變時自動置中 */}
								<ChangeView center={position} zoom={zoom} shouldAutoCenter={shouldAutoCenter} />
							</MapTileLayer>
						</div>
					</Splitter.Panel>
					<Splitter.Panel>
						<Flex vertical gap="middle">
						<Card className="search-bar" size="small" hoverable>
							<Flex vertical gap="middle">
								<Input
									placeholder="搜尋熱點或 SSID..."
									prefix={<SearchOutlined />}
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
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
									<Flex align="center" gap="small">
										<Switch
											checked={filters.longPressToMove}
											onChange={(checked) => setFilters({ ...filters, longPressToMove: checked })}
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
											style={{ width: 160 }}
											size="small"
											options={getAvailableGoogleMapsModes().map(mode => ({
												value: mode,
												label: getGoogleMapsModeDisplayName(mode),
											}))}
										/>
									</Flex>
								</Flex>
							</Flex>
						</Card>

						{/* 類別標籤 / Category tags */}
						<Flex gap="small" align="center" wrap>
							{[
								...new Set(filteredHotspots.slice(0, visibleHotspotCount)
									.map(h => h.category)
									.filter(Boolean)),
							].map((category, idx) => (
								<Tag
									key={category}
									color={['blue', 'green', 'red', 'gold', 'purple', 'cyan', 'orange', 'magenta'][idx % 8]}
									style={{
										//backgroundColor: ['blue', 'green', 'red', 'gold', 'purple', 'cyan', 'orange', 'magenta'][idx % 8],
									}}
								>
									{category}
								</Tag>
							))}
						</Flex>

						{/* 底部列表面板 / Bottom list panel */}
						<FacilityPointDataListAll
							data={{
								...facilityPointData,
								[EnumDatasetType.WIFI]: filteredHotspots,
							}}

							onClick={handleListItemClick}

							onOpenMap={handleOpenGoogleMaps}

							position={position}
							mapCenter={mapCenter!}
						/>
						</Flex>
					</Splitter.Panel>
				</Splitter>

				{/* 搜尋列 / Search bar */}


		</>
	);
}
