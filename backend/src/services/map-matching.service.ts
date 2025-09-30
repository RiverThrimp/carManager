import type { TrackPoint } from './track.service';

// OSRM Match API 限制：最多 100 个点
// 公共服务器可能更严格，建议 50 个点一组
const MAX_POINTS_PER_REQUEST = 50;

export class MapMatchingService {
  private readonly baseUrl = process.env.MAP_MATCHER_URL;

  async match(points: TrackPoint[]): Promise<TrackPoint[]> {
    console.log('[MapMatching] Service initialized:', {
      enabled: Boolean(this.baseUrl),
      baseUrl: this.baseUrl,
      pointsCount: points.length
    });

    if (!this.baseUrl || points.length < 2) {
      console.log('[MapMatching] Skipping - service disabled or insufficient points');
      return points;
    }

    const chunks = this.chunkPoints(points, MAX_POINTS_PER_REQUEST);
    const matchedChunks: TrackPoint[][] = [];

    console.log(`[MapMatching] Processing ${chunks.length} chunks`);

    for (const chunk of chunks) {
      try {
        console.log(`[MapMatching] Matching chunk with ${chunk.length} points...`);
        const matched = await this.requestMatch(chunk);
        console.log(`[MapMatching] Matched successfully, got ${matched.length} points`);
        matchedChunks.push(matched);
      } catch (error) {
        console.error('[MapMatching] Failed, falling back to raw points:', error);
        matchedChunks.push(chunk);
      }
    }

    const result = matchedChunks.flat();
    console.log(`[MapMatching] Total matched points: ${result.length}`);
    return result;
  }

  private chunkPoints(points: TrackPoint[], size: number) {
    const chunks: TrackPoint[][] = [];
    for (let i = 0; i < points.length; i += size) {
      chunks.push(points.slice(i, i + size));
    }
    return chunks;
  }

  private async requestMatch(points: TrackPoint[]): Promise<TrackPoint[]> {
    const coordinates = points
      .map((point) => `${point.longitude.toFixed(6)},${point.latitude.toFixed(6)}`)
      .join(';');

    const timestamps = points.map((point) => Math.floor(new Date(point.recordedAt).getTime() / 1000)).join(';');

    // 移除 timestamps，因为公共服务器可能不支持或导致问题
    const url = `${this.baseUrl}/match/v1/driving/${coordinates}?geometries=geojson&overview=full`;

    console.log(`[MapMatching] Requesting: ${url.substring(0, 150)}... (${points.length} points)`);

    try {
      // 设置超时：10 秒
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'VenicarsTrackingSystem/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        code: string;
        tracepoints?: Array<{ location: [number, number] } | null>;
        matchings?: Array<{
          geometry: {
            coordinates: [number, number][];
          };
        }>;
      };

      console.log(`[MapMatching] Response code: ${data.code}`);

      // 优先使用 matchings (匹配后的完整路径)
      if (data.code === 'Ok' && data.matchings?.[0]?.geometry?.coordinates) {
        const coords = data.matchings[0].geometry.coordinates;
        console.log(`[MapMatching] Using full matching path: ${coords.length} points`);

        // 将匹配的路径映射回原始点数量（均匀采样）
        return this.remapMatchedCoordinates(coords, points);
      }

      // 降级：使用 tracepoints (点对点匹配)
      if (data.tracepoints?.length) {
        console.log(`[MapMatching] Using tracepoints: ${data.tracepoints.length} points`);
        return points.map((point, index) => {
          const candidate = data.tracepoints![index];
          if (!candidate || !candidate.location) {
            return point;
          }

          const [lon, lat] = candidate.location;
          return {
            ...point,
            latitude: lat,
            longitude: lon
          };
        });
      }

      console.warn('[MapMatching] No valid response data, using raw points');
      return points;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Map matching timeout after 10s');
      }
      throw error;
    }
  }

  /**
   * 将 OSRM 返回的匹配路径重新映射到原始点数量
   */
  private remapMatchedCoordinates(
    matched: [number, number][],
    originalPoints: TrackPoint[]
  ): TrackPoint[] {
    if (matched.length === 0) {
      return originalPoints;
    }

    // 如果匹配的点数和原始点数接近，直接使用
    if (Math.abs(matched.length - originalPoints.length) < 10) {
      return originalPoints.map((point, idx) => {
        const coord = matched[Math.min(idx, matched.length - 1)];
        return {
          ...point,
          longitude: coord[0],
          latitude: coord[1]
        };
      });
    }

    // 否则，从匹配路径中均匀采样到原始点数量
    const result: TrackPoint[] = [];
    const step = (matched.length - 1) / (originalPoints.length - 1);

    for (let i = 0; i < originalPoints.length; i++) {
      const matchedIdx = Math.round(i * step);
      const coord = matched[matchedIdx];
      result.push({
        ...originalPoints[i],
        longitude: coord[0],
        latitude: coord[1]
      });
    }

    return result;
  }

  getStatus() {
    return {
      enabled: Boolean(this.baseUrl),
      baseUrl: this.baseUrl || 'not configured'
    };
  }
}
