import { AppDataSource } from '../config/data-source';
import { Position } from '../entities/position.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { SocketGateway } from './socket.service';

interface PositionInput {
  latitude: number;
  longitude: number;
  speed?: number;
  direction?: number;
  recordedAt?: string;
}

export class PositionService {
  private readonly repository = AppDataSource.getRepository(Position);
  private readonly vehicleRepository = AppDataSource.getRepository(Vehicle);

  async ingest(vehicleKey: string, input: PositionInput) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const vehicle = uuidPattern.test(vehicleKey)
      ? (await this.vehicleRepository.findOneBy({ id: vehicleKey })) ??
        (await this.vehicleRepository.findOneBy({ deviceId: vehicleKey }))
      : await this.vehicleRepository.findOneBy({ deviceId: vehicleKey });

    if (!vehicle) {
      throw Object.assign(new Error('Vehicle not found'), { status: 404 });
    }

    const position = this.repository.create({
      vehicle,
      latitude: input.latitude,
      longitude: input.longitude,
      speed: input.speed ?? 0,
      direction: input.direction ?? 0,
      recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date()
    });

    const saved = await this.repository.save(position);
    const payload = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['vehicle']
    });

    if (payload) {
      SocketGateway.broadcast('vehicle/position', payload);
    }

    return payload ?? saved;
  }
}
