import type { TrackPoint } from './track.service';

const MAX_POINTS_PER_REQUEST = 100;

export class MapMatchingService {
  private readonly baseUrl = process.env.MAP_MATCHER_URL;

  async match(points: TrackPoint[]): Promise<TrackPoint[]> {
    if (!this.baseUrl || points.length < 2) {
      return points;
    }

    const chunks = this.chunkPoints(points, MAX_POINTS_PER_REQUEST);
    const matchedChunks: TrackPoint[][] = [];

    for (const chunk of chunks) {
      try {
        const matched = await this.requestMatch(chunk);
        matchedChunks.push(matched);
      } catch (error) {
        console.error('Map matching failed, falling back to raw points', error);
        matchedChunks.push(chunk);
      }
    }

    return matchedChunks.flat();
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
}
