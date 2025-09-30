import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';

export class UserService {
  private readonly repository = AppDataSource.getRepository(User);

  async validateCredentials(username: string, password: string) {
    const user = await this.repository.findOne({ where: { username } });
    if (!user) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async createDefaultAdmin() {
    const existing = await this.repository.findOne({ where: { username: 'admin' } });
    if (existing) {
      return existing;
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = this.repository.create({
      username: 'admin',
      passwordHash,
      role: 'admin',
      email: 'admin@example.com'
    });

    return this.repository.save(admin);
  }
}
