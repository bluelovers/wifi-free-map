'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { IWiFiHotspot, IChargingStation } from '@/types';
import { EnumFacilityType } from '@/types';
import { generateWiFiQRCode, calculateDistance } from '@/lib/wifi-utils';
import EditHotspotForm from './EditHotspotForm';
import AddHotspotForm from './AddHotspotForm';

/**
 * 修正 Leaflet 預設圖示路徑
 * Fix Leaflet default icon paths
 */
const fixLeafletIcon = () => {
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
 * 地圖中心位置組件
 * Map center location component
 */
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

/**
 * 設施地圖組件
 * Facility map component
 */
export default function FacilityMap() {
    /** 手動定位模式點擊地圖時設定位置 */
    const ManualLocationHandler = () => {
        useMapEvents({
            click: (e) => {
                if (manualMode) {
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
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
    const [hotspots, setHotspots] = useState<IWiFiHotspot[]>([]);
    const [chargingStations, setChargingStations] = useState<IChargingStation[]>([]);
    const [position, setPosition] = useState<[number, number]>([25.0330, 121.5654]); // 預設台北 101
    const [zoom, setZoom] = useState(13); // 記錄目前縮放等級，會在置中前保存當前縮放
    /** 用於取得 Leaflet map 實例，以在需要時讀取當前 zoom 等級 */
    const mapRef = useRef<L.Map | null>(null);
    /** 監聽地圖縮放變化，保持 zoom state 與實際地圖同步 */
    const MapZoomHandler = () => {
        const map = useMap();
        /** 初始同步一次 */
        useEffect(() => {
            setZoom(map.getZoom());
        }, [map]);
        /** 監聽 zoomend 事件更新 zoom state */
        useEffect(() => {
            const updateZoom = () => setZoom(map.getZoom());
            map.on('zoomend', updateZoom);
            return () => {
                map.off('zoomend', updateZoom);
            };
        }, [map]);
        return null;
    };
    const [loading, setLoading] = useState(true);
    const [selectedHotspot, setSelectedHotspot] = useState<IWiFiHotspot | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [filters, setFilters] = useState({
        wifi: true,
        charging: true,
        userContrib: true,
        passwordOnly: false,
        maxDistance: 10000, // meters, default 10km
    });
    const [address, setAddress] = useState<string>(''); // 位置地址
    const [addressLoading, setAddressLoading] = useState<boolean>(false); // 地址查詢載入狀態
    const [locationError, setLocationError] = useState<boolean>(false);
    const [manualMode, setManualMode] = useState<boolean>(false);

    /** 取得 GPS 權限並嘗試獲取使用者位置（可重複呼叫） */
    const requestGeolocation = async (preserveZoom?: number) => {
        try {
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                if (result.state === 'denied') {
                    setLocationError(true);
                    return;
                }
            }
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setPosition([lat, lng]);
                    /** 若外部提供保留的 zoom，則使用它；若未提供則保持目前 zoom */
                    if (typeof preserveZoom === 'number') {
                        setZoom(preserveZoom);
                    }
                    setLocationError(false);
                    /** 反向地理編碼取得地址 */
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
                        const data = await res.json();
                        setAddress(data.display_name || '');
                    } catch {
                        setAddress('');
                    }
                },
                (err) => {
                    console.error('定位失敗 / Geolocation failed:', err);
                    setLocationError(true);
                }
            );
        } catch (e) {
            console.error('取得定位權限或位置時發生錯誤', e);
            setLocationError(true);
        }
    };

    /** 手動設定後，同步更新地址 */
    const updateAddress = async (lat: number, lng: number) => {
        setAddressLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setAddress(data.display_name || '');
        } catch {
            setAddress('');
        } finally {
            setAddressLoading(false);
        }
    };

    /** 搜尋關鍵字 */
    const [searchTerm, setSearchTerm] = useState('');

    /** 控制「新增熱點」對話框的顯示與關閉 */
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);

    /** 依據搜尋、密碼、距離過濾熱點 */
    const filteredHotspots = useMemo(() => {
        return hotspots.filter((hotspot) => {
            /** 關鍵字過濾：名稱或 SSID 包含搜尋字串（不分大小寫） */
            const term = searchTerm.trim().toLowerCase();
            if (term) {
                const nameMatch = hotspot.name?.toLowerCase().includes(term);
                const ssidMatch = hotspot.ssid?.toLowerCase().includes(term);
                if (!nameMatch && !ssidMatch) return false;
            }
            // 密碼過濾
            if (filters.passwordOnly && !hotspot.password) return false;
            // 距離過濾
            if (filters.maxDistance && position) {
                const dist = calculateDistance(position[0], position[1], hotspot.location.lat, hotspot.location.lng);
                if (dist > filters.maxDistance) return false;
            }
            return true;
        });
    }, [hotspots, searchTerm, filters, position]);

    // 載入設施資料
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                fixLeafletIcon();

                const hotspotsRes = await fetch('/api/hotspots');
                const hotspotsData = await hotspotsRes.json();
                if (hotspotsData.success) {
                    setHotspots(hotspotsData.data);
                }

                const chargingRes = await fetch('/api/charging');
                const chargingData = await chargingRes.json();
                if (chargingData.success) {
                    setChargingStations(chargingData.data);
                }
            } catch (error) {
                console.error('載入資料失敗 / Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);
    // 取得 GPS 權限並嘍試獲取使用者位置（已在外部定義）
    // 此 useEffect 只在元件掛載時呼叫一次
    useEffect(() => {
        const currentZoom = mapRef.current?.getZoom() ?? zoom;
        requestGeolocation(currentZoom).then(() => setZoom(currentZoom));
    }, []);
    // End of loadData effect

    // 生成 QR Code
    useEffect(() => {
        const generateQR = async () => {
            if (selectedHotspot?.ssid) {
                const password = selectedHotspot.password || '';
                if (password) {
                    const url = await generateWiFiQRCode(selectedHotspot.ssid, password);
                    setQrCodeUrl(url);
                } else {
                    setQrCodeUrl('');
                }
            }
        };
        generateQR();
    }, [selectedHotspot]);

    // 處理標記點擊
    const handleMarkerClick = (hotspot: IWiFiHotspot) => {
        setSelectedHotspot(hotspot);
    };

    // 開啟導航
    const openNavigation = (lat: number, lng: number, name: string) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    // 複製密碼
    const copyPassword = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('已複製 / Copied!');
        } catch {
            alert('複製失敗 / Copy failed');
        }
    };

    // 計算距離
    const getDistance = (lat: number, lng: number) => {
        const dist = calculateDistance(position[0], position[1], lat, lng);
        if (dist < 1000) {
            return `${Math.round(dist)} 公尺`;
        }
        return `${(dist / 1000).toFixed(1)} 公里`;
    };

    return (
        <div className="map-wrapper">
            {/* 位置錯誤提示與手動定位按鈕 */}
            {locationError && (
                <div className="error-panel" style={{ padding: '8px', backgroundColor: '#ffdddd', marginBottom: '8px' }}>
                    <span>定位失敗，請允許 GPS 或手動設定位置。</span>
                    <button onClick={() => setManualMode(true)} style={{ marginLeft: '8px' }}>手動定位</button>
                    <button onClick={() => requestGeolocation()} style={{ marginLeft: '8px' }}>重新請求定位</button>
                </div>
            )}
            {/* 手動置中按鈕 */}
            <div style={{ padding: '8px', marginBottom: '8px' }}>
                <button onClick={() => {
                const currentZoom = mapRef.current?.getZoom() ?? zoom;
                requestGeolocation(currentZoom).then(() => setZoom(currentZoom));
            }} style={{ marginRight: '8px' }}>置中至目前位置</button>
                {position && (
                    <span>座標: {position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
                )}
                {address && (
                    <div>地址: {address}</div>
                )}
            </div>
            {/* 地圖容器 */}
            <MapContainer center={position} zoom={zoom} style={{ height: '500px', width: '100%' }} scrollWheelZoom={true}>
<TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* 同步地圖縮放至 zoom state */}
                    <MapZoomHandler />
                {/* 使用者位置 */}
                <Marker
                    position={position}
                    icon={userIcon}
                    draggable={true}
                    eventHandlers={{
dragend: (e) => {
                              const latlng = e.target.getLatLng();
                              setPosition([latlng.lat, latlng.lng]);
                              // Preserve current zoom level; do not modify zoom
                              setLocationError(false);
                          },
                    }}
                />
                {/* 手動定位點擊監聽 */}
                <ManualLocationHandler />
                {/* WiFi 熱點 */}
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
                {/* 充電站 */}
                {chargingStations.map((station) => (
                    <Marker
                        key={station.id}
                        position={[station.location.lat, station.location.lng]}
                        icon={chargingIcon}
                    >
                        <Popup>{station.name}</Popup>
                    </Marker>
                ))}
                {/* 變更視角 */}
                <ChangeView center={position} zoom={zoom} />
            </MapContainer>
            {/* 搜尋列 / Search bar */}
            <div className="search-bar">
<input
                      type="text"
                      placeholder="搜尋熱點或 SSID... / Search hotspot or SSID..."
                      className="search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                <div className="filter-buttons">
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.wifi}
                            onChange={(e) => setFilters({ ...filters, wifi: e.target.checked })}
                        />
                        WiFi
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.charging}
                            onChange={(e) => setFilters({ ...filters, charging: e.target.checked })}
                        />
                        充電
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.passwordOnly}
                            onChange={(e) => setFilters({ ...filters, passwordOnly: e.target.checked })}
                        />
                        只顯示有密碼 / Password only
                    </label>
                    <label>
                        距離上限 (m) / Max distance (m):
                        <input
                            type="number"
                            min="0"
                            value={filters.maxDistance}
                            onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
                        />
                    </label>
</div>
        </div>

        {/* 編輯熱點表單 */}
        {showEditForm && selectedHotspot && (
          <EditHotspotForm
            hotspot={selectedHotspot}
            onClose={() => {
              setShowEditForm(false);
              // Refresh hotspots after edit
              // Simple approach: re-fetch data
              fetch('/api/hotspots')
                .then(res => res.json())
                .then(data => {
                  if (data.success) setHotspots(data.data);
                })
                .catch(err => console.error('刷新熱點失敗', err));
            }}
          />
        )}

    </div>
  );
}