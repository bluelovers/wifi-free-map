'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, useMapEvents, Pane, Rectangle, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { DivIcon } from 'leaflet';
import { Input, Switch, InputNumber, Space, Flex, Button, Card, Alert, Typography, Row, Tag } from 'antd';
import {
	SearchOutlined,
	WifiOutlined,
	ThunderboltOutlined,
	EnvironmentOutlined,
	ReloadOutlined,
	AimOutlined,
} from '@ant-design/icons';
import { IWiFiHotspot, IChargingStationMarker, IApiReturnWifi, IApiReturnError, IApiReturnCharging, IApiReturnBlocksBatch } from '@/types';
import { EnumFacilityType } from '@/types';
import { generateWiFiQRCode } from '@/lib/wifi-utils';
import { NOMINATIM_CONTACT_EMAIL } from '@/config/nominatim-config';
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import { MapTileLayer } from './map/MapTileLayer';
import { IGeoPointTupleLatLng, IGeoCoord, IGpsLngLatMinMax, EnumDatasetType } from '@/lib/utils/grid/grid-types';
import { requestPermissionsGeolocation } from '@/lib/utils/api/browser-api';
import { fetchOSMReverseInfo } from '@/lib/utils/api/fetch-api';
import { CircleMarkerSVG } from './map/icon/CircleMarkerSVG';
import { _formatBlockKey, getAndFormatDistance } from '@/lib/utils/geo/geo-formatter';
import { normalizeCoordToMarkerPrecision, wrapCoordinate, wrapCoordinateFromPointTupleLatLng, wrapPointTupleLatLngFromCoordinate } from '@/lib/utils/geo/geo-transform';
import { calculateDistance } from '@/lib/utils/geo/geo-math';

/**
 * 修正 Leaflet 預設圖示路徑
 * Fix Leaflet default icon paths
 */
const fixLeafletIcon = () =>
{
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	delete (L.Icon.Default.prototype as any)._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
		iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
		shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	});
};

/**
 * 自定義圖示
 * Custom markers
 */
const wifiIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

const chargingIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

const userIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

/**
 * 地圖中心位置組件（僅響應位置變更，不響應縮放）
 * Map center location component (only responds to position changes, not zoom)
 */
function ChangeView({ center, shouldAutoCenter }: { center: [number, number], zoom: number, shouldAutoCenter: boolean })
{
	const map = useMap();
	useEffect(() =>
	{
		/** 只有在需要自動置中時才移動地圖 */
		if (shouldAutoCenter)
		{
			map.setView(center, undefined, { animate: false });
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
		userContrib: true,
		passwordOnly: false,
		maxDistance: 10000, // meters, default 10km
		longPressToMove: true, // 右鍵點擊地圖移動定位點（預設開啟）
	});
	/** 顯示列表面板 / Show list panel */
	const [showList, setShowList] = useState<boolean>(true);

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
	const [hotspots, setHotspots] = useState<IWiFiHotspot[]>([]);
	const [chargingStations, setChargingStations] = useState<IChargingStationMarker[]>([]);
	/** 當前資料的範圍邊界 / Current data range bounds */
	const [rangeBounds, setRangeBounds] = useState<IGpsLngLatMinMax | null>(null);
	const [position, setPosition] = useState<IGeoPointTupleLatLng>([25.0330, 121.5654]); // 預設台北 101
	const [zoom, setZoom] = useState(18); // 記錄目前縮放等級，會在置中前保存當前縮放
	/** 用於取得 Leaflet map 實例，以在需要時讀取當前 zoom 等級 */
	const mapRef = useRef<L.Map | null>(null);


	/** 檢查座標是否在當前範圍內 */
	const isCoordWithinRange = (coord: IGeoCoord, range: IGpsLngLatMinMax): boolean =>
	{
		return (
			coord.lng >= range.minLng &&
			coord.lng <= range.maxLng &&
			coord.lat >= range.minLat &&
			coord.lat <= range.maxLat
		);
	};

	/** 載入設施資料的函式 */
	const loadBlockData = async (coord: IGeoCoord) =>
	{
		console.log('[loadBlockData] rangeBounds:', rangeBounds, 'coord:', coord);

		/** 檢查是否需要獲取新資料 */
		const needsFetch = !rangeBounds || !isCoordWithinRange(coord, rangeBounds);
		console.log('[loadBlockData] needsFetch:', needsFetch);

		console.log('[loadBlockData] rangeBounds:', rangeBounds, 'coord:', coord,
			'\nMapCenter:', coord,
			'\nposition:', (position && wrapCoordinateFromPointTupleLatLng(position)),
			'\nneedsFetch:', needsFetch, needsFetch && '範圍內，跳過請求',
		);

		/** 總是更新 mapCenter 以觸發重新排序 */
		setMapCenter(coord);

		if (!needsFetch)
		{
			return;
		}

		try
		{
			setLoading(true);
			fixLeafletIcon();

			/** 使用批次 API 讀取區塊內的所有資料 */
			const url = `/api/blocks-batch?lat=${coord.lat}&lng=${coord.lng}`;
			console.log('[loadBlockData] Fetching:', url);
			const batchRes = await fetch(url);
			const batchData: IApiReturnBlocksBatch = await batchRes.json();

			console.log('[loadBlockData] API response:', batchData.success,
				'wifi count:', batchData.data?.[EnumDatasetType.WIFI]?.length,
				'charging count:', batchData.data?.[EnumDatasetType.CHARGING]?.length,
				'range:', batchData.rangeBuckets);

			if (batchData.success)
			{
				setHotspots(batchData.data?.[EnumDatasetType.WIFI] || []);
				setChargingStations(batchData.data?.[EnumDatasetType.CHARGING] || []);
				/** 更新範圍邊界 */
				setRangeBounds(batchData.rangeBuckets);
			}
			else
			{
				console.error('載入資料失敗:', (batchData as any as IApiReturnError).error);
				setHotspots([]);
				setChargingStations([]);
			}
		}
		catch (error)
		{
			console.error('載入資料失敗:', error);
		}
		finally
		{
			setLoading(false);
		}
	};

	/** 地圖移動結束時重新載入資料 */
	const MapMoveHandler = () =>
	{
		const map = useMap();
		const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

		useEffect(() =>
		{
			const handleMoveEnd = () =>
			{
				const center = map.getCenter();
				const mapCenterCoord: IGeoCoord = normalizeCoordToMarkerPrecision(center);

				console.log('[MapMoveHandler] 地圖移動到:', mapCenterCoord);

				/** 檢查位置是否改變 */
				if (lastPositionRef.current &&
					lastPositionRef.current.lat === center.lat &&
					lastPositionRef.current.lng === center.lng)
				{
					console.log('[MapMoveHandler] 位置没变，跳过');
					return;
				}

				lastPositionRef.current = {
					lat: center.lat,
					lng: center.lng,
				};

				/** 使用 debounce 避免頻繁載入 */
				setTimeout(() =>
				{
					loadBlockData(mapCenterCoord);
				}, 300);
			};

			map.on('moveend', handleMoveEnd);
			map.on('zoomend', handleMoveEnd);

			return () =>
			{
				map.off('moveend', handleMoveEnd);
				map.off('zoomend', handleMoveEnd);
			};
		}, [map]);

		return null;
	};

	const [loading, setLoading] = useState(true);
	const [selectedHotspot, setSelectedHotspot] = useState<IWiFiHotspot | null>(null);
	const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
	const [address, setAddress] = useState<string>(''); // 位置地址
	const [addressLoading, setAddressLoading] = useState<boolean>(false); // 地址查詢載入狀態
	const [locationError, setLocationError] = useState<boolean>(false);
	const [manualMode, setManualMode] = useState<boolean>(false);
	const [shouldAutoCenter, setShouldAutoCenter] = useState<boolean>(false); // 是否應該自動置中
	const [addressSearchTerm, setAddressSearchTerm] = useState<string>(''); // 地址搜尋關鍵字
	const [addressSearchLoading, setAddressSearchLoading] = useState<boolean>(false); // 地址搜尋載入狀態
	/** 地址搜尋結果 / Address search results */
	const [addressSearchResults, setAddressSearchResults] = useState<{
		lat: string,
		lon: string,
		display_name: string
	}[]>([]);

	/** 顯示的熱點數量（分頁用）/ Number of visible hotspots (for pagination) */
	const [visibleHotspotCount, setVisibleHotspotCount] = useState(20);

	/** 每次載入的熱點數量 / Number of hotspots to load per batch */
	const HOTSPOTS_PER_PAGE = 20;

	/** 取得 GPS 權限並嘗試獲取使用者位置（可重複呼叫） */
	const requestGeolocation = async (preserveZoom?: number): Promise<void> =>
	{
		return new Promise(async (resolve, reject) =>
		{
			await requestPermissionsGeolocation()
				.then(result =>
				{
					return getPosition(preserveZoom, resolve, reject);
				})
				.catch((e) =>
				{
					setLocationError(true);
					return reject(e)
				})
		});
	};

	/** 獲取位置的实际執行函式 */
	const getPosition = (preserveZoom: number | undefined, resolve: () => void, reject: (reason?: unknown) => void) =>
	{
		navigator.geolocation.getCurrentPosition(
			async (pos) =>
			{
				const coord = wrapCoordinate(pos.coords.longitude, pos.coords.latitude);

				/** 標記需要自動置中 */
				setShouldAutoCenter(true);
				setPosition(wrapPointTupleLatLngFromCoordinate(coord));
				/** 若外部提供保留的 zoom，則使用它；若未提供則保持目前 zoom */
				if (typeof preserveZoom === 'number')
				{
					setZoom(preserveZoom);
				}
				setLocationError(false);
				/** 反向地理編碼取得地址 */

				updateAddress(coord);
				resolve();
			},
			(err) =>
			{
				console.error('定位失敗 / Geolocation failed:', err);
				setLocationError(true);
				reject(err);
			},
		);
	};

	/** 手動設定後，同步更新地址 */
	const updateAddress = async (coord: IGeoCoord) =>
	{
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

	/** 上次搜尋的關鍵字 */
	const lastSearchTermRef = useRef<string>('');

	/** 搜尌 debounce 標記 */
	const debouncingRef = useRef<boolean>(false);

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
			setAddressSearchLoading(true);
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
				setAddressSearchLoading(false);
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

	/** 地圖中心座標 */
	const [mapCenter, setMapCenter] = useState<IGeoCoord | null>(null);

	/** 依據搜尋、密碼、距離過濾熱點 */
	const filteredHotspots = useMemo(() =>
	{
		console.log('[filteredHotspots] hotspots:', hotspots.length, 'mapCenter:', mapCenter);

		/** 優先使用地圖中心排序，否則使用定位點 */
		const from: IGeoCoord = (position && wrapCoordinateFromPointTupleLatLng(position)) || mapCenter;

		if (!from)
		{
			return hotspots;
		}

		/** 先複製陣列避免原地修改 */
		let filtered = [...hotspots].filter((hotspot) =>
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
			// 距離過濾
			if (filters.maxDistance && from)
			{
				const dist = calculateDistance(from, hotspot);
				if (dist > filters.maxDistance) return false;
			}
			return true;
		});

		console.log('[filteredHotspots] filtered:', filtered.length, 'from:', from, 'total source:', hotspots.length);

		/** 依照距離排序 / Sort by distance */
		filtered = filtered.sort((a, b) =>
		{
			const distA = calculateDistance(from, a);
			const distB = calculateDistance(from, b);
			return distA - distB;
		});

		return filtered;
	}, [hotspots, searchTerm, filters, position, mapCenter]);

	/** 當過濾條件改變時重置顯示數量 / Reset visible count when filters change */
	useEffect(() =>
	{
		setVisibleHotspotCount(HOTSPOTS_PER_PAGE);
	}, [searchTerm, filters, position]);

	// 初始載入資料（使用區塊化 API）
	useEffect(() =>
	{
		// fixLeafletIcon();

		/** 使用區塊化 API 根據目前位置載入 */
		loadBlockData(wrapCoordinateFromPointTupleLatLng(position));
	}, []);
	// 取得 GPS 權限並嘗試獲取使用者位置（已在外部定義）
	// 此 useEffect 只在元件掛載時呼叫一次
	useEffect(() =>
	{
		const currentZoom = mapRef.current?.getZoom() ?? zoom;
		requestGeolocation(currentZoom).then(() => setZoom(currentZoom));
	}, []);
	// End of loadData effect

	// 生成 QR Code
	useEffect(() =>
	{
		const generateQR = async () =>
		{
			if (selectedHotspot?.ssid)
			{
				const password = selectedHotspot.password || '';
				if (password)
				{
					const url = await generateWiFiQRCode(selectedHotspot.ssid, password);
					setQrCodeUrl(url);
				}
				else
				{
					setQrCodeUrl('');
				}
			}
		};
		generateQR();
	}, [selectedHotspot]);

	// 處理標記點擊
	const handleMarkerClick = (hotspot: IWiFiHotspot) =>
	{
		setSelectedHotspot(hotspot);
	};

	// 處理列表項目點擊 - 連動地圖
	const handleListItemClick = (hotspot: IWiFiHotspot) =>
	{
		setSelectedHotspot(hotspot);
		setShouldAutoCenter(true);
		setPosition(wrapPointTupleLatLngFromCoordinate(hotspot));
		setZoom(16); // 放大到能看到詳細資訊的等級
	};

	/**
	 * 地圖包裝容器
	 * Map wrapper container
	 */
	return (
		<>
			<Flex vertical gap="small" className={`map-wrapper${showList ? ' with-list' : ''}`}>
				{/* 位置錯誤提示與手動定位按鈕 */}
				{locationError && (
					<Alert
						message="定位失敗，請允許 GPS 或手動設定位置。"
						action={
							<Space>
								<Button size="small" onClick={() => setManualMode(true)}>手動定位</Button>
								<Button size="small" icon={<ReloadOutlined />}
								        onClick={() => requestGeolocation()}>重新請求定位</Button>
							</Space>
						}
						type="error"
					/>
				)}
				{/* 座標與地址資訊（保留在上方） */}
				<Flex vertical gap="small" className="info-panel">
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
						<Typography.Text>縮放: {zoom}</Typography.Text>
					</Flex>
				</Flex>
				{/* 地址搜尋表單 */}
				<div style={{ position: 'relative' }}>
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
				</div>
				{/* 地圖容器 */}
				<div style={{ position: 'relative', height: '500px', width: '100%' }}>
					<MapTileLayer
						center={position}
						zoom={zoom}
						style={{ height: '100%', width: '100%' }}
						doubleClickZoom={false}

						mapRef={mapRef}
						setZoom={setZoom}
					>

						{/* 地圖移動時重新載入區塊資料 */}
						<MapMoveHandler />

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

						>

						</CircleMarkerSVG>

						{/* 手動定位點擊監聽 */}
						<ManualLocationHandler />
						{/* 右鍵點擊移動定位點 */}
						<LongPressHandler />
						{/* WiFi 熱點 */}
						<MarkerClusterGroup chunkedLoading>
							{filteredHotspots.map((hotspot, index) => (
								<Marker
									key={hotspot.id ?? hotspot.lng + '_' + hotspot.lat + '_' + index}
									position={hotspot}
									icon={wifiIcon}
									eventHandlers={{ click: () => handleMarkerClick(hotspot) }}
								>
									<Popup>{hotspot.name}</Popup>
								</Marker>
							))}
						</MarkerClusterGroup>
						{/* 充電站 */}
						<MarkerClusterGroup chunkedLoading>
							{chargingStations.map((station, index) => (
								<Marker
									key={station.id ?? station.lng + '_' + station.lat + '_' + index}
									position={station}
									icon={chargingIcon}
								>
									<Popup>{station.name}</Popup>
								</Marker>
							))}
						</MarkerClusterGroup>
						{/* 變更視角 - 當位置改變時自動置中 */}
						<ChangeView center={position} zoom={zoom} shouldAutoCenter={shouldAutoCenter} />
					</MapTileLayer>

					{/* 浮動置中按鈕（Google Maps 風格） */}
					<Button
						type="primary"
						shape="circle"
						icon={<AimOutlined />}
						onClick={() =>
						{
							console.log('Center button clicked, mapRef:', mapRef.current);
							if (mapRef.current)
							{
								const currentZoom = mapRef.current.getZoom();
								console.log('Current zoom:', currentZoom);
								requestGeolocation(currentZoom)
									.then(() =>
									{
										console.log('Geolocation success');
										setZoom(currentZoom);
									})
									.catch(err => console.error('Geolocation error:', err));
							}
							else
							{
								console.log('No map ref, using default zoom');
								requestGeolocation(zoom)
									.then(() =>
									{
										setZoom(zoom);
									})
									.catch(err => console.error('Geolocation error:', err));
							}
						}}
						style={{
							position: 'absolute',
							bottom: '30px',
							right: '10px',
							zIndex: 1000,
						}}
						title="置中至目前位置"
					/>
				</div>
				{/* 搜尋列 / Search bar */}
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
								<Typography.Text>距離上限 (m):</Typography.Text>
								<InputNumber
									min={0}
									value={filters.maxDistance}
									onChange={(value) => setFilters({ ...filters, maxDistance: value || 10000 })}
									style={{ width: 100 }}
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
								<Switch
									checked={showList}
									onChange={(checked) => setShowList(checked)}
									size="small"
								/>
								<Typography.Text>顯示列表</Typography.Text>
							</Flex>
						</Flex>
					</Flex>
				</Card>

				<Flex>
					{false && filteredHotspots.map((hotspot) => (
						<Tag key={hotspot.id} color="blue" variant="solid">
							{hotspot.name}
						</Tag>
					))}
				</Flex>

				{/* 底部列表面板 / Bottom list panel */}
				{showList && (
					<Card
						className="bottom-panel"
						style={{
							maxHeight: '320px',
							// overflow: 'visible',
							overflow: 'auto',
						}}
						title={`WiFi 熱點列表 (${filteredHotspots.length})`}
						size="small"
						hoverable

						onScroll={(e) =>
						{
							/** 捲動到底部時載入更多 / Load more when scrolled to bottom */
							const target = e.target as HTMLDivElement;
							const scrollBottom = target.scrollTop + target.clientHeight;
							if (scrollBottom >= target.scrollHeight - 50)
							{
								/** 載入更多熱點 / Load more hotspots */
								if (visibleHotspotCount < filteredHotspots.length)
								{
									setVisibleHotspotCount(prev => prev + HOTSPOTS_PER_PAGE);
								}
							}
						}}
					>
						<Flex
							className="facility-list"
							wrap
							justify={'space-around'}
							align="flex-start"
						>
							{filteredHotspots.slice(0, visibleHotspotCount).map((hotspot, index) => (
								<Card
									key={hotspot.id ?? hotspot.lng + '_' + hotspot.lat + '_' + index}
									className="facility-item"

									hoverable
									variant="outlined"
									size="small"

									style={{
										cursor: 'pointer',
										width: 300,
										marginBottom: 10,
									}}
									onClick={() => handleListItemClick(hotspot)}
								>
									<WifiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
									<Flex vertical gap="zero">
										<Typography.Text strong>{hotspot.name}</Typography.Text>
										{hotspot.address && (
											<Typography.Text type="secondary" style={{ fontSize: '12px' }}>
												{hotspot.address}
											</Typography.Text>
										)}
										<Typography.Text type="secondary" style={{ fontSize: '12px' }}>
											{hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
											{' • '}{getAndFormatDistance(wrapCoordinateFromPointTupleLatLng(position), hotspot)}
											{hotspot.password && ' • 有密碼'}
										</Typography.Text>
									</Flex>
								</Card>
							))}
						</Flex>
						{visibleHotspotCount < filteredHotspots.length && (
							<Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', padding: '8px' }}>
								還有 {filteredHotspots.length - visibleHotspotCount} 個熱點...
							</Typography.Text>
						)}
					</Card>
				)}

			</Flex>
		</>
	);
}
