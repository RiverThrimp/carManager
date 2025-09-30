import { AppDataSource } from '../config/data-source';
import { Driver } from '../entities/driver.entity';

interface DriverInput {
  name: string;
  licenseNumber: string;
  phone?: string;
}

export class DriverService {
  private readonly repository = AppDataSource.getRepository(Driver);

  list() {
    return this.repository.find();
  }

  create(input: DriverInput) {
    const driver = this.repository.create(input);
    return this.repository.save(driver);
  }

  async update(id: string, input: Partial<DriverInput>) {
    const driver = await this.repository.findOneBy({ id });
    if (!driver) {
      throw Object.assign(new Error('Driver not found'), { status: 404 });
    }

    Object.assign(driver, input);
    return this.repository.save(driver);
  }
}
