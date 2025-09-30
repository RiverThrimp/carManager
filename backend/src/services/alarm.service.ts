import { AppDataSource } from '../config/data-source';
import { Alarm } from '../entities/alarm.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { SocketGateway } from './socket.service';

interface AlarmInput {
  vehicleId: string;
  type: string;
  payload?: Record<string, unknown>;
  raisedAt: string;
}

export class AlarmService {
  private readonly repository = AppDataSource.getRepository(Alarm);
  private readonly vehicleRepository = AppDataSource.getRepository(Vehicle);

  list(limit: number) {
    return this.repository.find({
      order: { raisedAt: 'DESC' },
      take: limit,
      relations: ['vehicle']
    });
  }

  async ingest(input: AlarmInput) {
    const vehicle =
      (await this.vehicleRepository.findOneBy({ id: input.vehicleId })) ??
      (await this.vehicleRepository.findOneBy({ deviceId: input.vehicleId }));

    if (!vehicle) {
      throw Object.assign(new Error('Vehicle not found'), { status: 404 });
    }

    const alarm = this.repository.create({
      vehicle,
      type: input.type,
      payload: input.payload ?? null,
      raisedAt: new Date(input.raisedAt)
    });

    const saved = await this.repository.save(alarm);
    const payload = await this.repository.findOne({ where: { id: saved.id }, relations: ['vehicle'] });
    if (payload) {
      SocketGateway.broadcast('vehicle/alarm', payload);
    }
    return payload ?? saved;
  }
}
