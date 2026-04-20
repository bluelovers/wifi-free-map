'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Input, Switch, InputNumber, Space, Flex, Button, Card, List, Alert, Typography } from 'antd';
import { SearchOutlined, WifiOutlined, ThunderboltOutlined, EnvironmentOutlined, ReloadOutlined, AimOutlined } from '@ant-design/icons';
import type { IWiFiHotspot, IChargingStation } from '@/types';
import { EnumFacilityType } from '@/types';
import { generateWiFiQRCode, calculateDistance } from '@/lib/wifi-utils';
import { NOMINATIM_CONTACT_EMAIL } from '@/config/nominatim-config';
import EditHotspotForm from './EditHotspotForm';
import AddHotspotForm from './AddHotspotForm';
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import { MapTileLayer } from './map/MapTileLayer';

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
					const lat = e.latlng.lat;
					const lng = e.latlng.lng;
					setShouldAutoCenter(false); // 手動模式不自動置中
					setPosition([lat, lng]);
					/** 保持目前的 zoom 等級，不改變 */
					setLocationError(false);
					setManualMode(false);
					updateAddress(lat, lng);
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
	const [showList, setShowList] = useState<boolean>(false);

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
				const lat = e.latlng.lat;
				const lng = e.latlng.lng;
				setShouldAutoCenter(false); // 不自動置中
				setPosition([lat, lng]);
				setLocationError(false);
				updateAddress(lat, lng);
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
	const [chargingStations, setChargingStations] = useState<IChargingStation[]>([]);
	const [position, setPosition] = useState<[number, number]>([25.0330, 121.5654]); // 預設台北 101
	const [zoom, setZoom] = useState(18); // 記錄目前縮放等級，會在置中前保存當前縮放
	/** 用於取得 Leaflet map 實例，以在需要時讀取當前 zoom 等級 */
	const mapRef = useRef<L.Map | null>(null);
	/** 監聽地圖縮放變化，保持 zoom state 與實際地圖同步 */
	const MapZoomHandler = () =>
	{
		const map = useMap();

		/** 當 map 準備就緒時，取得 map 實例 */
		useEffect(() =>
		{
			if (map)
			{
				mapRef.current = map;
			}
		}, [map]);

		/** 初始同步一次 */
		useEffect(() =>
		{
			setZoom(map.getZoom());
		}, [map]);
		/** 監聽 zoomend 事件更新 zoom state */
		useEffect(() =>
		{
			const updateZoom = () => setZoom(map.getZoom());
			map.on('zoomend', updateZoom);
			return () =>
			{
				map.off('zoomend', updateZoom);
			};
		}, [map]);
		return null;
	};
	/** 載入設施資料的函式（可重複呼叫） */
	const loadBlockData = async (lat: number, lng: number) =>
	{
		try
		{
			setLoading(true);
			fixLeafletIcon();

			/** 讀取區塊內的 WiFi 資料 */
			const hotspotsRes = await fetch(`/api/hotspots-block?lat=${lat}&lng=${lng}`);
			const hotspotsData = await hotspotsRes.json();
			if (hotspotsData.success)
			{
				setHotspots(hotspotsData.data || []);
			}
			else
			{
				console.error('載入 WiFi 失敗:', hotspotsData.error);
				setHotspots([]);
			}

			/** 讀取充電站資料 */
			const chargingRes = await fetch(`/api/charging-block?lat=${lat}&lng=${lng}`);
			const chargingData = await chargingRes.json();
			if (chargingData.success)
			{
				setChargingStations(chargingData.data || []);
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
				const lat = center.lat;
				const lng = center.lng;

				/** 檢查位置是否改變 */
				if (lastPositionRef.current &&
					lastPositionRef.current.lat === lat &&
					lastPositionRef.current.lng === lng)
				{
					return;
				}

				lastPositionRef.current = { lat, lng };

				/** 使用 debounce 避免頻繁載入 */
				setTimeout(() =>
				{
					loadBlockData(lat, lng);
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
	const [addressSearchResults, setAddressSearchResults] = useState<{
		lat: string,
		lon: string,
		display_name: string
	}[]>([]); // 地址搜尋結果

	/** 取得 GPS 權限並嘗試獲取使用者位置（可重複呼叫） */
	const requestGeolocation = async (preserveZoom?: number): Promise<void> =>
	{
		return new Promise((resolve, reject) =>
		{
			try
			{
				if (navigator.permissions && navigator.permissions.query)
				{
					navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) =>
					{
						if (result.state === 'denied')
						{
							setLocationError(true);
							reject(new Error('Geolocation denied'));
							return;
						}
						getPosition(preserveZoom, resolve, reject);
					}).catch(() =>
					{
						getPosition(preserveZoom, resolve, reject);
					});
				}
				else
				{
					getPosition(preserveZoom, resolve, reject);
				}
			}
			catch (e)
			{
				console.error('取得定位權限或位置時發生錯誤', e);
				setLocationError(true);
				reject(e);
			}
		});
	};

	/** 獲取位置的实际執行函式 */
	const getPosition = (preserveZoom: number | undefined, resolve: () => void, reject: (reason?: unknown) => void) =>
	{
		navigator.geolocation.getCurrentPosition(
			async (pos) =>
			{
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				/** 標記需要自動置中 */
				setShouldAutoCenter(true);
				setPosition([lat, lng]);
				/** 若外部提供保留的 zoom，則使用它；若未提供則保持目前 zoom */
				if (typeof preserveZoom === 'number')
				{
					setZoom(preserveZoom);
				}
				setLocationError(false);
				/** 反向地理編碼取得地址 */
				try
				{
					const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
					const data = await res.json();
					setAddress(data.display_name || '');
				}
				catch
				{
					setAddress('');
				}
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
	const updateAddress = async (lat: number, lng: number) =>
	{
		setAddressLoading(true);
		try
		{
			const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
				headers: {
					'User-Agent': `WiFi-Free-Map/1.0 (${NOMINATIM_CONTACT_EMAIL})`,
				},
			});
			const data = await res.json();
			setAddress(data.display_name || '');
		}
		catch
		{
			setAddress('');
		}
		finally
		{
			setAddressLoading(false);
		}
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
						enhancedResults.sort((a, b) =>
						{
							const distA = calculateDistance(position[0], position[1], parseFloat(a.lat), parseFloat(b.lon));
							const distB = calculateDistance(position[0], position[1], parseFloat(b.lat), parseFloat(b.lon));

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
		setPosition([lat, lng]);
		setAddress(result.display_name);
		setAddressSearchTerm('');
		setAddressSearchResults([]);
	};

	/** 搜尋關鍵字 */
	const [searchTerm, setSearchTerm] = useState('');

	/** 控制「新增熱點」對話框的顯示與關閉 */
	const [showAddForm, setShowAddForm] = useState(false);
	const [showEditForm, setShowEditForm] = useState(false);

	/** 依據搜尋、密碼、距離過濾熱點 */
	const filteredHotspots = useMemo(() =>
	{
		return hotspots.filter((hotspot) =>
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
			if (filters.maxDistance && position)
			{
				const dist = calculateDistance(position[0], position[1], hotspot.location.lat, hotspot.location.lng);
				if (dist > filters.maxDistance) return false;
			}
			return true;
		});
	}, [hotspots, searchTerm, filters, position]);

	// 初始載入資料（使用區塊化 API）
	useEffect(() =>
	{
		fixLeafletIcon();

		/** 使用區塊化 API 根據目前位置載入 */
		const currentLat = position[0];
		const currentLng = position[1];
		loadBlockData(currentLat, currentLng);
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
		setPosition([hotspot.location.lat, hotspot.location.lng]);
		setZoom(16); // 放大到能看到詳細資訊的等級
	};

	// 開啟導航
	const openNavigation = (lat: number, lng: number, name: string) =>
	{
		const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
		window.open(url, '_blank');
	};

	// 複製密碼
	const copyPassword = async (text: string) =>
	{
		try
		{
			await navigator.clipboard.writeText(text);
			alert('已複製 / Copied!');
		}
		catch
		{
			alert('複製失敗 / Copy failed');
		}
	};

	// 計算距離
	const getDistance = (lat: number, lng: number) =>
	{
		const dist = calculateDistance(position[0], position[1], lat, lng);
		if (dist < 1000)
		{
			return `${Math.round(dist)} 公尺`;
		}
		return `${(dist / 1000).toFixed(1)} 公里`;
	};

	/**
	 * 地圖包裝容器
	 * Map wrapper container
	 */
	return (
		<Flex vertical gap="small" className={`map-wrapper${showList ? ' with-list' : ''}`}>
			{/* 位置錯誤提示與手動定位按鈕 */}
			{locationError && (
				<Alert
					message="定位失敗，請允許 GPS 或手動設定位置。"
					action={
						<Space>
							<Button size="small" onClick={() => setManualMode(true)}>手動定位</Button>
							<Button size="small" icon={<ReloadOutlined />} onClick={() => requestGeolocation()}>重新請求定位</Button>
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
						<List
							dataSource={addressSearchResults}
							renderItem={(result, index) => (
								<List.Item
									key={index}
									style={{ cursor: 'pointer', padding: '8px 12px' }}
									onClick={() => selectAddressResult(result)}
								>
									{result.display_name}
								</List.Item>
							)}
						/>
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
				>
					{/* 同步地圖縮放至 zoom state */}
					<MapZoomHandler />
					{/* 地圖移動時重新載入區塊資料 */}
					<MapMoveHandler />
					{/* 使用者位置 */}
					<Marker
						position={position}
						icon={userIcon}
						draggable={true}
						eventHandlers={{
							dragend: (e) =>
							{
								const latlng = e.target.getLatLng();
								/** 拖曳定位點後，不自動置中（打斷瀏覽體驗） */
								setShouldAutoCenter(false);
								setPosition([latlng.lat, latlng.lng]);
								// Preserve current zoom level; do not modify zoom
								setLocationError(false);
								/** 更新拖曳後的地址 */
								updateAddress(latlng.lat, latlng.lng);
							},
						}}
					/>
					{/* 手動定位點擊監聽 */}
					<ManualLocationHandler />
					{/* 右鍵點擊移動定位點 */}
					<LongPressHandler />
					{/* WiFi 熱點 */}
					<MarkerClusterGroup chunkedLoading>
						{filteredHotspots.map((hotspot) => (
							<Marker
								key={hotspot.id}
								position={[hotspot.location.lat, hotspot.location.lng]}
								icon={wifiIcon}
								eventHandlers={{ click: () => handleMarkerClick(hotspot) }}
							>
								<Popup>{hotspot.name}</Popup>
							</Marker>
						))}
					</MarkerClusterGroup>
					{/* 充電站 */}
					<MarkerClusterGroup chunkedLoading>
						{chargingStations.map((station) => (
							<Marker
								key={station.id}
								position={[station.location.lat, station.location.lng]}
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
			<Card className="search-bar" size="small">
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

							{/* 底部列表面板 / Bottom list panel */}
				{showList && (
					<Card
						className="bottom-panel"
						style={{
							maxHeight: '300px',
							overflow: 'auto',
						}}
						title={<Typography.Title level={5}>WiFi 熱點列表 ({filteredHotspots.length})</Typography.Title>}
						size="small"
					>
						<List
							className="facility-list"
							dataSource={filteredHotspots.slice(0, 20)}
							renderItem={(hotspot) => (
								<List.Item
									className="facility-item"
									style={{ cursor: 'pointer' }}
									onClick={() => handleListItemClick(hotspot)}
								>
									<Flex align="center" gap="middle">
										<WifiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
										<Flex vertical gap="zero">
											<Typography.Text strong>{hotspot.name}</Typography.Text>
											{hotspot.location.address && (
												<Typography.Text type="secondary" style={{ fontSize: '12px' }}>
													{hotspot.location.address}
												</Typography.Text>
											)}
											<Typography.Text type="secondary" style={{ fontSize: '12px' }}>
												{hotspot.location.lat.toFixed(4)}, {hotspot.location.lng.toFixed(4)}
												{' • '}{getDistance(hotspot.location.lat, hotspot.location.lng)}
												{hotspot.password && ' • 有密碼'}
											</Typography.Text>
										</Flex>
									</Flex>
								</List.Item>
							)}
						/>
						{filteredHotspots.length > 20 && (
							<Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', padding: '8px' }}>
								還有 {filteredHotspots.length - 20} 個熱點...
							</Typography.Text>
						)}
					</Card>
				)}

			{/* 編輯熱點表單 */}
			{showEditForm && selectedHotspot && (
				<EditHotspotForm
					hotspot={selectedHotspot}
					onClose={() =>
					{
						setShowEditForm(false);
						// Refresh hotspots after edit
						// Simple approach: re-fetch data
						fetch('/api/hotspots')
							.then(res => res.json())
							.then(data =>
							{
								if (data.success) setHotspots(data.data);
							})
							.catch(err => console.error('刷新熱點失敗', err));
					}}
				/>
			)}

		</Flex>
	);
}
