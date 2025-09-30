import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Driver } from './driver.entity';

@Entity({ name: 'vehicles' })
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  vin!: string;

  @Column({ name: 'plate_number', unique: true })
  plateNumber!: string;

  @Column({ name: 'device_id', type: 'varchar', unique: true, nullable: true })
  deviceId!: string | null;

  @Column({ default: 'inactive' })
  status!: 'active' | 'inactive';

  @ManyToOne(() => Driver, (driver) => driver.vehicles, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: Driver | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
