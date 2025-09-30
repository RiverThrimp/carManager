import { Empty, Spin } from 'antd';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

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

const containerStyle: CSSProperties = { height: 360, width: '100%' };
const BAIDU_MAP_AK = import.meta.env.VITE_BAIDU_MAP_AK ?? '';
const BAIDU_MAP_SCRIPT_ID = 'baidu-map-gl-script';
const BAIDU_MAP_CALLBACK = '__baiduMapOnLoad__';

const PI = Math.PI;
const X_PI = (PI * 3000) / 180;

const outOfChina = (lng: number, lat: number) =>
  lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;

const transformLat = (lng: number, lat: number) => {
  let ret =
    -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
};

const transformLng = (lng: number, lat: number) => {
  let ret =
    300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
};

const wgs84ToGcj02 = (lng: number, lat: number): [number, number] => {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  }
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * PI);
  const mgLat = lat + dLat;
  const mgLng = lng + dLng;
  return [mgLng, mgLat];
};

const gcj02ToBd09 = (lng: number, lat: number): [number, number] => {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI);
  const bdLng = z * Math.cos(theta) + 0.0065;
  const bdLat = z * Math.sin(theta) + 0.006;
  return [bdLng, bdLat];
};

const wgs84ToBd09 = (lng: number, lat: number): [number, number] => {
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
  return gcj02ToBd09(gcjLng, gcjLat);
};

let scriptPromise: Promise<typeof window.BMapGL> | null = null;

const loadBaiduMap = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('百度地图仅在浏览器环境下可用'));
  }

  if (window.BMapGL) {
    return Promise.resolve(window.BMapGL);
  }

  if (!BAIDU_MAP_AK) {
    return Promise.reject(new Error('缺少百度地图 AK 配置'));
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(BAIDU_MAP_SCRIPT_ID) as HTMLScriptElement | null;
      if (existing) {
        existing.remove();
      }

      const script = document.createElement('script');
      script.id = BAIDU_MAP_SCRIPT_ID;
      script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${BAIDU_MAP_AK}&callback=${BAIDU_MAP_CALLBACK}`;
      script.onerror = () => {
        script.remove();
        scriptPromise = null;
        reject(new Error('百度地图脚本加载失败'));
        delete (window as WindowWithBaiduMap).__baiduMapOnLoad__;
      };

      (window as WindowWithBaiduMap).__baiduMapOnLoad__ = () => {
        resolve(window.BMapGL);
        delete (window as WindowWithBaiduMap).__baiduMapOnLoad__;
      };

      document.body.appendChild(script);
    });
  }

  return scriptPromise;
};

export const ReportTrackMap = ({ points, loading = false }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState<boolean>(
    typeof window !== 'undefined' && Boolean(window.BMapGL)
  );
  const [mapError, setMapError] = useState<string | null>(null);

  const validPoints = useMemo(
    () =>
      points.filter(
        (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
      ),
    [points]
  );

  const hasPoints = validPoints.length > 0;

  useEffect(() => {
    let cancelled = false;

    loadBaiduMap()
      .then(() => {
        if (!cancelled) {
          setMapReady(true);
          setMapError(null);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setMapError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !containerRef.current) {
      return;
    }

    const { BMapGL } = window;
    if (!BMapGL) {
      return;
    }

    if (!mapInstanceRef.current) {
      const map = new BMapGL.Map(containerRef.current);
      map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 11);
      map.enableScrollWheelZoom(true);
      mapInstanceRef.current = map;
    }
  }, [mapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const { BMapGL } = window;

    if (!mapReady || !map || !BMapGL) {
      return;
    }

    overlaysRef.current.forEach((overlay) => map.removeOverlay(overlay));
    overlaysRef.current = [];

    if (!hasPoints) {
      return;
    }

    const path = validPoints
      .map((point) => {
        const [lng, lat] = wgs84ToBd09(point.longitude, point.latitude);
        return new BMapGL.Point(lng, lat);
      })
      .filter((item) => Number.isFinite(item.lng) && Number.isFinite(item.lat));

    if (path.length > 1) {
      const polyline = new BMapGL.Polyline(path, {
        strokeColor: '#1677ff',
        strokeWeight: 4,
        strokeOpacity: 0.8
      });
      map.addOverlay(polyline);
      overlaysRef.current.push(polyline);
    }

    const addMarker = (position: (typeof path)[number], labelText: string, color: string) => {
      const marker = new BMapGL.Marker(position);
      const label = new BMapGL.Label(labelText, {
        position,
        offset: new BMapGL.Size(12, -20)
      });
      label.setStyle({
        color: '#fff',
        backgroundColor: color,
        border: 'none',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '12px'
      });
      marker.setLabel(label);
      map.addOverlay(marker);
      overlaysRef.current.push(marker);
    };

    if (path.length) {
      addMarker(path[0], '起点', '#52c41a');
    }
    if (path.length > 1) {
      addMarker(path[path.length - 1], '终点', '#ff4d4f');
    }

    if (path.length === 1) {
      map.centerAndZoom(path[0], 16);
    } else {
      map.setViewport(path, { margins: [40, 40, 40, 40] });
    }
  }, [mapReady, hasPoints, validPoints]);

  useEffect(
    () => () => {
      const map = mapInstanceRef.current;
      if (map) {
        overlaysRef.current.forEach((overlay) => map.removeOverlay(overlay));
        overlaysRef.current = [];
        mapInstanceRef.current = null;
      }
    },
    []
  );

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (mapError) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={mapError} />
      </div>
    );
  }

  if (!mapReady) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!hasPoints) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={points.length ? '轨迹坐标无效' : '暂无轨迹'} />
      </div>
    );
  }

  return <div ref={containerRef} style={containerStyle} />;
};

interface WindowWithBaiduMap extends Window {
  BMapGL: any;
  __baiduMapOnLoad__?: () => void;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends WindowWithBaiduMap {}
}
