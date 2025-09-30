import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity({ name: 'alarms' })
export class Alarm {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column()
  type!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ name: 'raised_at', type: 'timestamptz' })
  raisedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
