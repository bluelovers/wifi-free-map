'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { IWiFiHotspot, IChargingStation } from '@/types';
import { EnumFacilityType } from '@/types';
import { generateWiFiQRCode, calculateDistance } from '@/lib/wifi-utils';

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
    });

    // 載入設施資料
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                fixLeafletIcon();

                // 讀取 WiFi 熱點
                const hotspotsRes = await fetch('/api/hotspots');
                const hotspotsData = await hotspotsRes.json();
                if (hotspotsData.success) {
                    setHotspots(hotspotsData.data);
                }

                // 讀取充電設施
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
                    placeholder="搜尋地點... / Search location..."
                    className="search-input"
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
                </div>
            </div>

            {/* 載入中 / Loading */}
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>載入設施資料中... / Loading facilities...</p>
                </div>
            )}

            {/* 地圖 / Map */}
            <MapContainer
                center={position}
                zoom={zoom}
                scrollWheelZoom={true}
                className="leaflet-container"
            >
                <ChangeView center={position} zoom={zoom} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 使用者位置 / User location */}
                <CircleMarker
                    center={position}
                    radius={8}
                    pathOptions={{
                        color: '#2196F3',
                        fillColor: '#2196F3',
                        fillOpacity: 1,
                    }}
                >
                    <Popup>您的位置 / Your location</Popup>
                </CircleMarker>

                {/* WiFi 熱點標記 / WiFi hotspot markers */}
                {filters.wifi && hotspots.map((hotspot) => (
                    <Marker
                        key={hotspot.id}
                        position={[hotspot.location.lat, hotspot.location.lng]}
                        icon={hotspot.source === 'itaiwan' ? wifiIcon : userIcon}
                        eventHandlers={{
                            click: () => handleMarkerClick(hotspot),
                        }}
                    >
                        <Popup>
                            <div className="hotspot-popup">
                                <h4>{hotspot.name}</h4>
                                <p><strong>SSID:</strong> {hotspot.ssid}</p>
                                <p><strong>距離:</strong> {getDistance(hotspot.location.lat, hotspot.location.lng)}</p>
                                <p><strong>地址:</strong> {hotspot.location.address}</p>
                                {hotspot.openTime && (
                                    <p><strong>開放時間:</strong> {hotspot.openTime}</p>
                                )}
                                {hotspot.password && (
                                    <p><strong>密碼:</strong> {hotspot.password}</p>
                                )}
                                {qrCodeUrl && selectedHotspot?.id === hotspot.id && (
                                    <div className="qr-section">
                                        <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
                                        <button
                                            onClick={() => openNavigation(hotspot.location.lat, hotspot.location.lng, hotspot.name)}
                                            className="nav-button"
                                        >
                                            導航 / Navigate
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => openNavigation(hotspot.location.lat, hotspot.location.lng, hotspot.name)}
                                    className="nav-button"
                                >
                                    導航 / Navigate
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* 充電設施標記 / Charging station markers */}
                {filters.charging && chargingStations.map((station) => (
                    <Marker
                        key={station.id}
                        position={[station.location.lat, station.location.lng]}
                        icon={chargingIcon}
                    >
                        <Popup>
                            <div className="charging-popup">
                                <h4>{station.name}</h4>
                                <p><strong>類型:</strong> {station.type}</p>
                                <p><strong>距離:</strong> {getDistance(station.location.lat, station.location.lng)}</p>
                                <p><strong>地址:</strong> {station.location.address}</p>
                                {station.socketTypes && (
                                    <p><strong>插座:</strong> {station.socketTypes.join(', ')}</p>
                                )}
                                {station.openingHours && (
                                    <p><strong>開放時間:</strong> {station.openingHours}</p>
                                )}
                                <button
                                    onClick={() => openNavigation(station.location.lat, station.location.lng, station.name)}
                                    className="nav-button"
                                >
                                    導航 / Navigate
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* 底部列表 / Bottom list */}
            <div className="bottom-panel">
                <h3>附近設施 / Nearby Facilities</h3>
                <div className="facility-list">
                    {hotspots.slice(0, 5).map((hotspot) => (
                        <div key={hotspot.id} className="facility-item" onClick={() => {
                            setPosition([hotspot.location.lat, hotspot.location.lng]);
                            setSelectedHotspot(hotspot);
                        }}>
                            <span className="facility-icon">📶</span>
                            <div className="facility-info">
                                <div className="facility-name">{hotspot.name}</div>
                                <div className="facility-detail">
                                    {hotspot.ssid} • {getDistance(hotspot.location.lat, hotspot.location.lng)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}