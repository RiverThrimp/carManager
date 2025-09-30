import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Driver } from '../entities/driver.entity';
import { Position } from '../entities/position.entity';
import { Alarm } from '../entities/alarm.entity';
import { DailyReport } from '../entities/daily-report.entity';
import { MonthlyReport } from '../entities/monthly-report.entity';
import { WeeklyReport } from '../entities/weekly-report.entity';
import { YearlyReport } from '../entities/yearly-report.entity';

const isTest = process.env.NODE_ENV === 'test';
const shouldSynchronize = process.env.DB_SYNCHRONIZE === 'true' || isTest;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'venicars',
  password: process.env.POSTGRES_PASSWORD ?? 'venicars',
  database: process.env.POSTGRES_DB ?? (isTest ? 'venicars_test' : 'venicars'),
  synchronize: shouldSynchronize,
  logging: false,
  entities: [
    User,
    Vehicle,
    Driver,
    Position,
    Alarm,
    DailyReport,
    MonthlyReport,
    WeeklyReport,
    YearlyReport
  ],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js']
});
