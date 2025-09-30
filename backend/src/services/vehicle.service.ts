import { AppDataSource } from '../config/data-source';
import { Vehicle } from '../entities/vehicle.entity';
import { Driver } from '../entities/driver.entity';

interface VehicleInput {
  vin: string;
  plateNumber: string;
  deviceId?: string | null;
  status?: 'active' | 'inactive';
  driverId?: string | null;
}

export class VehicleService {
  private readonly repository = AppDataSource.getRepository(Vehicle);
  private readonly driverRepository = AppDataSource.getRepository(Driver);

  list() {
    return this.repository.find({ relations: ['driver'] });
  }

  async create(input: VehicleInput) {
    const sanitizedDeviceId =
      typeof input.deviceId === 'string' ? input.deviceId.trim() : input.deviceId ?? null;

    const vehicle = this.repository.create({
      vin: input.vin,
      plateNumber: input.plateNumber,
      status: input.status ?? 'active',
      deviceId: sanitizedDeviceId && sanitizedDeviceId.length > 0 ? sanitizedDeviceId : null
    });

    if (input.driverId) {
      vehicle.driver = await this.driverRepository.findOneBy({ id: input.driverId });
    }

    return this.repository.save(vehicle);
  }

  async update(id: string, input: VehicleInput) {
    const vehicle = await this.repository.findOne({ where: { id }, relations: ['driver'] });
    if (!vehicle) {
      throw Object.assign(new Error('Vehicle not found'), { status: 404 });
    }

    const sanitizedDeviceId =
      typeof input.deviceId === 'string' ? input.deviceId.trim() : input.deviceId;

    vehicle.vin = input.vin ?? vehicle.vin;
    vehicle.plateNumber = input.plateNumber ?? vehicle.plateNumber;
    vehicle.status = input.status ?? vehicle.status;
    if (sanitizedDeviceId !== undefined) {
      vehicle.deviceId = sanitizedDeviceId && sanitizedDeviceId.length > 0 ? sanitizedDeviceId : null;
    }

    if (input.driverId !== undefined) {
      vehicle.driver = input.driverId
        ? await this.driverRepository.findOneBy({ id: input.driverId })
        : null;
    }

    return this.repository.save(vehicle);
  }

  async remove(id: string) {
    const vehicle = await this.repository.findOneBy({ id });
    if (!vehicle) {
      throw Object.assign(new Error('Vehicle not found'), { status: 404 });
    }
    await this.repository.delete(id);
  }
}
