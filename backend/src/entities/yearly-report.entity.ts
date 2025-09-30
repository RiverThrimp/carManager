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

@Entity({ name: 'reports_yearly' })
export class YearlyReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ type: 'varchar', length: 4, name: 'report_year' })
  reportYear!: string; // e.g. 2025

  @Column('decimal', { precision: 12, scale: 2, name: 'total_distance_km', default: 0 })
  totalDistanceKm!: number;

  @Column('int', { name: 'active_months', default: 0 })
  activeMonths!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
