import { Between, type FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Position } from '../entities/position.entity';
import { MapMatchingService } from './map-matching.service';

export interface TrackPoint {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  direction: number;
  recordedAt: Date;
  createdAt: Date;
}

export class TrackService {
  private readonly repository = AppDataSource.getRepository(Position);
  private readonly mapMatching = new MapMatchingService();

  // 轨迹点采样配置
  private readonly MAX_TRACK_POINTS = 500; // 最大返回点数
  private readonly MIN_TIME_INTERVAL_SECONDS = 10; // 最小时间间隔（秒）

  async getHistory(vehicleId: string, start?: string, end?: string) {
    const where: FindOptionsWhere<Position> = { vehicle: { id: vehicleId } };

    if (start && end) {
      where.recordedAt = Between(new Date(start), new Date(end));
    }

    const results = await this.repository.find({ where, order: { recordedAt: 'ASC' }, relations: ['vehicle'] });

    console.log(`[TrackService] Raw points from DB: ${results.length}`);

    const points: TrackPoint[] = results.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle?.id ?? vehicleId,
      latitude: row.latitude,
      longitude: row.longitude,
      speed: row.speed,
      direction: row.direction,
      recordedAt: row.recordedAt,
      createdAt: row.createdAt
    }));

    // 如果点太多，进行采样
    const sampledPoints = this.samplePoints(points);
    console.log(`[TrackService] After sampling: ${sampledPoints.length} points`);

    return this.mapMatching.match(sampledPoints);
  }

  /**
   * 智能采样轨迹点
   * 策略：保留起点、终点、关键转折点，均匀抽稀中间点
   */
  private samplePoints(points: TrackPoint[]): TrackPoint[] {
    if (points.length <= this.MAX_TRACK_POINTS) {
      return points;
    }

    const sampled: TrackPoint[] = [];

    // 始终保留第一个点
    sampled.push(points[0]);

    // 基于时间间隔的采样
    let lastTime = new Date(points[0].recordedAt).getTime();
    const minInterval = this.MIN_TIME_INTERVAL_SECONDS * 1000;

    for (let i = 1; i < points.length - 1; i++) {
      const currentTime = new Date(points[i].recordedAt).getTime();
      const timeDiff = currentTime - lastTime;

      // 如果时间间隔足够大，或者是关键点（速度变化、方向变化），保留
      const speedChange = Math.abs(points[i].speed - points[i - 1].speed) > 10;
      const directionChange = Math.abs(points[i].direction - points[i - 1].direction) > 30;

      if (timeDiff >= minInterval || speedChange || directionChange) {
        sampled.push(points[i]);
        lastTime = currentTime;
      }
    }

    // 始终保留最后一个点
    sampled.push(points[points.length - 1]);

    // 如果采样后还是太多，进行二次均匀采样
    if (sampled.length > this.MAX_TRACK_POINTS) {
      return this.uniformSample(sampled, this.MAX_TRACK_POINTS);
    }

    return sampled;
  }

  /**
   * 均匀采样
   */
  private uniformSample(points: TrackPoint[], targetCount: number): TrackPoint[] {
    if (points.length <= targetCount) {
      return points;
    }

    const result: TrackPoint[] = [points[0]]; // 保留起点
    const step = (points.length - 1) / (targetCount - 1);

    for (let i = 1; i < targetCount - 1; i++) {
      const index = Math.round(i * step);
      result.push(points[index]);
    }

    result.push(points[points.length - 1]); // 保留终点
    return result;
  }

  getLatest(limit = 20) {
    return this.repository.find({
      relations: ['vehicle'],
      order: { recordedAt: 'DESC' },
      take: limit
    });
  }
}
