// 高德路径规划 API 集成（可选功能）

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY ?? '';

interface RoutePoint {
  location: string; // "lng,lat"
}

interface RouteResponse {
  status: string;
  route?: {
    paths?: Array<{
      steps?: Array<{
        polyline?: string;
      }>;
    }>;
  };
}

/**
 * 将 GPS 轨迹点通过高德路径规划 API 转换为道路路径
 * @param points 原始 GPS 点数组 [[lat, lng], ...]
 * @returns 贴合道路的路径点数组
 */
export async function snapToRoads(
  points: [number, number][]
): Promise<[number, number][]> {
  if (!AMAP_KEY) {
    console.warn('未配置高德地图 API Key，跳过路径规划');
    return points;
  }

  if (points.length < 2) {
    return points;
  }

  // 高德 API 限制：最多支持16个途经点
  // 如果点太多，需要采样
  const maxPoints = 16;
  const sampledPoints = points.length > maxPoints
    ? samplePoints(points, maxPoints)
    : points;

  try {
    const origin = `${sampledPoints[0][1]},${sampledPoints[0][0]}`; // lng,lat
    const destination = `${sampledPoints[sampledPoints.length - 1][1]},${sampledPoints[sampledPoints.length - 1][0]}`;

    // 途经点（排除起点和终点）
    const waypoints = sampledPoints
      .slice(1, -1)
      .map(p => `${p[1]},${p[0]}`)
      .join(';');

    const params = new URLSearchParams({
      key: AMAP_KEY,
      origin,
      destination,
      strategy: '0', // 速度优先
    });

    if (waypoints) {
      params.append('waypoints', waypoints);
    }

    const response = await fetch(
      `https://restapi.amap.com/v3/direction/driving?${params.toString()}`
    );

    const data: RouteResponse = await response.json();

    if (data.status === '1' && data.route?.paths?.[0]?.steps) {
      // 解析返回的路径
      const routePoints: [number, number][] = [];

      for (const step of data.route.paths[0].steps) {
        if (step.polyline) {
          const coords = step.polyline.split(';');
          for (const coord of coords) {
            const [lng, lat] = coord.split(',').map(Number);
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
              routePoints.push([lat, lng]);
            }
          }
        }
      }

      return routePoints.length > 0 ? routePoints : points;
    }

    return points;
  } catch (error) {
    console.error('路径规划失败:', error);
    return points;
  }
}

/**
 * 对点数组进行均匀采样
 */
function samplePoints(points: [number, number][], targetCount: number): [number, number][] {
  if (points.length <= targetCount) {
    return points;
  }

  const result: [number, number][] = [points[0]]; // 始终包含起点
  const step = (points.length - 1) / (targetCount - 1);

  for (let i = 1; i < targetCount - 1; i++) {
    const index = Math.round(i * step);
    result.push(points[index]);
  }

  result.push(points[points.length - 1]); // 始终包含终点
  return result;
}