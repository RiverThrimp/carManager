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

  async getHistory(vehicleId: string, start?: string, end?: string) {
    const where: FindOptionsWhere<Position> = { vehicle: { id: vehicleId } };

    if (start && end) {
      where.recordedAt = Between(new Date(start), new Date(end));
    }

    const results = await this.repository.find({ where, order: { recordedAt: 'ASC' }, relations: ['vehicle'] });

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

    return this.mapMatching.match(points);
  }

  getLatest(limit = 20) {
    return this.repository.find({
      relations: ['vehicle'],
      order: { recordedAt: 'DESC' },
      take: limit
    });
  }
}
