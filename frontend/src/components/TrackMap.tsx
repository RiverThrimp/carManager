import { Empty, Spin, Switch } from 'antd';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { snapToRoads } from '../utils/mapRouting';

export interface TrackPoint {
  id: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  speed: number;
  direction: number;
}

interface Props {
  points: TrackPoint[];
  loading?: boolean;
}

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Custom icons for start and end markers
const startIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path fill="#52c41a" d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 16 8 16s8-10.5 8-16c0-4.42-3.58-8-8-8z"/>
      <circle fill="white" cx="12" cy="8" r="3"/>
    </svg>
  `),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36]
});

const endIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path fill="#ff4d4f" d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 16 8 16s8-10.5 8-16c0-4.42-3.58-8-8-8z"/>
      <circle fill="white" cx="12" cy="8" r="3"/>
    </svg>
  `),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36]
});

// Catmull-Rom spline interpolation for smooth curves
function catmullRomSpline(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  numPoints: number
): [number, number][] {
  const result: [number, number][] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    const t2 = t * t;
    const t3 = t2 * t;

    const lat =
      0.5 *
      (2 * p1[0] +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);

    const lng =
      0.5 *
      (2 * p1[1] +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

    result.push([lat, lng]);
  }

  return result;
}

// Smooth track points using Catmull-Rom spline
function smoothTrack(positions: [number, number][], segmentPoints: number = 8): [number, number][] {
  if (positions.length < 2) return positions;
  if (positions.length === 2) return positions;

  const smoothed: [number, number][] = [];

  // Add first point
  smoothed.push(positions[0]);

  // Process middle segments
  for (let i = 0; i < positions.length - 1; i++) {
    const p0 = positions[Math.max(0, i - 1)];
    const p1 = positions[i];
    const p2 = positions[i + 1];
    const p3 = positions[Math.min(positions.length - 1, i + 2)];

    const segment = catmullRomSpline(p0, p1, p2, p3, segmentPoints);
    smoothed.push(...segment);
  }

  // Add last point
  smoothed.push(positions[positions.length - 1]);

  return smoothed;
}

// Component to fit bounds when points change
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], 16);
    } else {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [positions, map]);

  return null;
}

export const TrackMap = ({ points, loading = false }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useSmoothing, setUseSmoothing] = useState(false); // 默认关闭平滑，显示后端返回的原始数据
  const [useRouting, setUseRouting] = useState(false);
  const [routedPositions, setRoutedPositions] = useState<[number, number][] | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  const validPoints = useMemo(
    () =>
      points.filter(
        (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
      ),
    [points]
  );

  const rawPositions = useMemo<[number, number][]>(
    () => validPoints.map((p) => [p.latitude, p.longitude]),
    [validPoints]
  );

  // 路径规划
  useEffect(() => {
    if (!useRouting || rawPositions.length < 2) {
      setRoutedPositions(null);
      return;
    }

    setRoutingLoading(true);
    snapToRoads(rawPositions)
      .then((routed) => {
        setRoutedPositions(routed);
      })
      .catch((error) => {
        console.error('路径规划失败:', error);
        setRoutedPositions(null);
      })
      .finally(() => {
        setRoutingLoading(false);
      });
  }, [useRouting, rawPositions]);

  const positions = useMemo<[number, number][]>(() => {
    if (useRouting && routedPositions) {
      return routedPositions;
    }
    return useSmoothing ? smoothTrack(rawPositions, 10) : rawPositions;
  }, [rawPositions, useSmoothing, useRouting, routedPositions]);

  const hasPoints = positions.length > 0;
  const defaultCenter: [number, number] = [39.9042, 116.4074]; // Beijing
  const defaultZoom = 11;

  if (loading || routingLoading) {
    return (
      <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip={routingLoading ? '路径规划中...' : undefined} />
      </div>
    );
  }

  if (!hasPoints) {
    return (
      <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={points.length ? '轨迹坐标无效' : '暂无轨迹'} />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: 360, width: '100%', position: 'relative' }}>
      {/* 控制面板 */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          background: 'white',
          padding: '8px 12px',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
          {useRouting ? '🛣️ 前端路径规划' : useSmoothing ? '📐 前端曲线平滑' : '🌐 后端 OSRM 匹配'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            size="small"
            checked={useSmoothing}
            onChange={setUseSmoothing}
            disabled={useRouting}
          />
          <span style={{ fontSize: 12 }}>前端平滑</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            size="small"
            checked={useRouting}
            onChange={setUseRouting}
          />
          <span style={{ fontSize: 12 }}>前端规划</span>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* 使用高德地图瓦片服务（国内访问较快） */}
        <TileLayer
          attribution='&copy; <a href="https://www.amap.com/">高德地图</a>'
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
          subdomains={['1', '2', '3', '4']}
        />

        {/* 轨迹线 - 平滑曲线 */}
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: '#1677ff',
              weight: 4,
              opacity: 0.8,
              smoothFactor: 1
            }}
          />
        )}

        {/* 原始轨迹点（可选显示） */}
        {!useSmoothing && rawPositions.length > 2 && rawPositions.slice(1, -1).map((pos, idx) => (
          <Marker
            key={idx}
            position={pos}
            icon={L.divIcon({
              className: 'track-point',
              html: '<div style="width:6px;height:6px;background:#1677ff;border-radius:50%;border:2px solid white;"></div>',
              iconSize: [10, 10],
              iconAnchor: [5, 5]
            })}
          />
        ))}

        {/* 起点标记 */}
        {rawPositions.length > 0 && (
          <Marker position={rawPositions[0]} icon={startIcon} />
        )}

        {/* 终点标记 */}
        {rawPositions.length > 1 && (
          <Marker position={rawPositions[rawPositions.length - 1]} icon={endIcon} />
        )}

        {/* 自动调整视野 */}
        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  );
};