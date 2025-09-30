import type { TrackPoint } from './track.service';

const MAX_POINTS_PER_REQUEST = 100;

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

    const url = `${this.baseUrl}/match/v1/driving/${coordinates}?annotations=duration,distance&geometries=geojson&timestamps=${timestamps}`;

    console.log(`[MapMatching] Requesting: ${url.substring(0, 200)}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Map matcher responded with status ${response.status}`);
    }

    const data = (await response.json()) as {
      tracepoints: Array<{ location: [number, number] } | null>;
    };

    if (!data.tracepoints?.length) {
      return points;
    }

    return points.map((point, index) => {
      const candidate = data.tracepoints[index];
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

  getStatus() {
    return {
      enabled: Boolean(this.baseUrl),
      baseUrl: this.baseUrl || 'not configured'
    };
  }
}
