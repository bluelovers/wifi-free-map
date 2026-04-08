'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const [hotspots, setHotspots] = useState<IWiFiHotspot[]>([]);
    const [chargingStations, setChargingStations] = useState<IChargingStation[]>([]);
    const [position, setPosition] = useState<[number, number]>([25.0330, 121.5654]); // 預設台北 101
    const [zoom, setZoom] = useState(13);
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

    // 搜尋關鍵字
    const [searchTerm, setSearchTerm] = useState('');

    // 控制「新增熱點」對話框的顯示與關閉
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);

    // 依據搜尋、密碼、距離過濾熱點
    const filteredHotspots = useMemo(() => {
        return hotspots.filter((hotspot) => {
            // 關鍵字過濾：名稱或 SSID 包含搜尋字串（不分大小寫）
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
        
        // 嘗試獲取使用者位置
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setZoom(15);
                },
                (err) => {
                    console.error('定位失敗 / Geolocation failed:', err);
                }
            );
        }
    }, []);

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