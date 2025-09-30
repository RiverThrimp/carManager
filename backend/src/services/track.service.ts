import { Between, type FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Position } from '../entities/position.entity';

export class TrackService {
  private readonly repository = AppDataSource.getRepository(Position);

  getHistory(vehicleId: string, start?: string, end?: string) {
    const where: FindOptionsWhere<Position> = { vehicle: { id: vehicleId } };

    if (start && end) {
      where.recordedAt = Between(new Date(start), new Date(end));
    }

    return this.repository.find({ where, order: { recordedAt: 'ASC' } });
  }

  getLatest(limit = 20) {
    return this.repository.find({
      relations: ['vehicle'],
      order: { recordedAt: 'DESC' },
      take: limit
    });
  }
}
