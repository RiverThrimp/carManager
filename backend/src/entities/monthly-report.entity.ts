import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity({ name: 'reports_monthly' })
export class MonthlyReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ type: 'varchar', length: 7, name: 'report_month' })
  reportMonth!: string;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_distance_km', default: 0 })
  totalDistanceKm!: number;

  @Column('int', { name: 'active_days', default: 0 })
  activeDays!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
