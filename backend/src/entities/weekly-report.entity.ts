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

@Entity({ name: 'reports_weekly' })
export class WeeklyReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ type: 'varchar', length: 8, name: 'report_week' })
  reportWeek!: string; // e.g. 2025-W40

  @Column({ type: 'date', name: 'week_start' })
  weekStart!: string;

  @Column({ type: 'date', name: 'week_end' })
  weekEnd!: string;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_distance_km', default: 0 })
  totalDistanceKm!: number;

  @Column('int', { name: 'total_trips', default: 0 })
  totalTrips!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
