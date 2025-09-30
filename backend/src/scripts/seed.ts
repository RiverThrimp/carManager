import 'dotenv/config';
import { AppDataSource } from '../config/data-source';
import { Driver } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Position } from '../entities/position.entity';
import { Alarm } from '../entities/alarm.entity';
import { DailyReport } from '../entities/daily-report.entity';
import { MonthlyReport } from '../entities/monthly-report.entity';
import { WeeklyReport } from '../entities/weekly-report.entity';
import { YearlyReport } from '../entities/yearly-report.entity';

const driverSeeds = [
  { name: 'Alice Chen', licenseNumber: 'ZJ12345678', phone: '13800000001' },
  { name: 'Wang Lei', licenseNumber: 'ZJ87654321', phone: '13800000002' },
  { name: 'Liu Yan', licenseNumber: 'ZJ99887766', phone: '13800000003' }
];

const vehicleSeeds = [
  {
    vin: 'VNCA1234567890001',
    plateNumber: 'ZJ-10001',
    deviceId: 'JT8080001',
    status: 'active' as const,
    driverLicense: 'ZJ12345678'
  },
  {
    vin: 'VNCA1234567890002',
    plateNumber: 'ZJ-10002',
    deviceId: 'JT8080002',
    status: 'active' as const,
    driverLicense: 'ZJ87654321'
  },
  {
    vin: 'VNCA1234567890003',
    plateNumber: 'ZJ-10003',
    deviceId: 'JT8080003',
    status: 'inactive' as const,
    driverLicense: 'ZJ99887766'
  }
];

const now = new Date();
const minutes = (value: number) => new Date(now.getTime() - value * 60 * 1000);
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfISOWeek = (date: Date) => {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setDate(clone.getDate() + diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const endOfISOWeek = (date: Date) => {
  const start = startOfISOWeek(date);
  const clone = new Date(start);
  clone.setDate(start.getDate() + 6);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const isoWeekLabel = (date: Date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const seed = async () => {
  await AppDataSource.initialize();

  const driverRepo = AppDataSource.getRepository(Driver);
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  const positionRepo = AppDataSource.getRepository(Position);
  const alarmRepo = AppDataSource.getRepository(Alarm);
  const dailyRepo = AppDataSource.getRepository(DailyReport);
  const monthlyRepo = AppDataSource.getRepository(MonthlyReport);
  const weeklyRepo = AppDataSource.getRepository(WeeklyReport);
  const yearlyRepo = AppDataSource.getRepository(YearlyReport);

  console.log('Seeding drivers...');
  for (const data of driverSeeds) {
    const existing = await driverRepo.findOne({ where: { licenseNumber: data.licenseNumber } });
    if (existing) {
      existing.name = data.name;
      existing.phone = data.phone;
      await driverRepo.save(existing);
      continue;
    }
    const driver = driverRepo.create(data);
    await driverRepo.save(driver);
  }

  const driverByLicense = new Map<string, Driver>();
  for (const driver of await driverRepo.find()) {
    driverByLicense.set(driver.licenseNumber, driver);
  }

  console.log('Seeding vehicles...');
  for (const spec of vehicleSeeds) {
    const driver = driverByLicense.get(spec.driverLicense) ?? null;
    let vehicle = await vehicleRepo.findOne({ where: { vin: spec.vin }, relations: ['driver'] });
    if (!vehicle) {
      vehicle = vehicleRepo.create({
        vin: spec.vin,
        plateNumber: spec.plateNumber,
        deviceId: spec.deviceId,
        status: spec.status,
        driver
      });
    } else {
      vehicle.plateNumber = spec.plateNumber;
      vehicle.deviceId = spec.deviceId;
      vehicle.status = spec.status;
      vehicle.driver = driver;
    }
    await vehicleRepo.save(vehicle);
  }

  const vehicles = await vehicleRepo.find({ relations: ['driver'] });
  const vehicleByVin = new Map<string, Vehicle>();
  for (const vehicle of vehicles) {
    vehicleByVin.set(vehicle.vin, vehicle);
  }

  if ((await positionRepo.count()) === 0) {
    console.log('Creating sample positions...');
    const v1 = vehicleByVin.get('VNCA1234567890001');
    const v2 = vehicleByVin.get('VNCA1234567890002');
    const v3 = vehicleByVin.get('VNCA1234567890003');

    const positionPayload = [
      v1 && {
        vehicle: v1,
        latitude: 30.27415,
        longitude: 120.15515,
        speed: 42.5,
        direction: 90,
        recordedAt: minutes(5)
      },
      v1 && {
        vehicle: v1,
        latitude: 30.275,
        longitude: 120.158,
        speed: 38.2,
        direction: 95,
        recordedAt: minutes(3)
      },
      v2 && {
        vehicle: v2,
        latitude: 30.3,
        longitude: 120.18,
        speed: 55.1,
        direction: 120,
        recordedAt: minutes(8)
      },
      v3 && {
        vehicle: v3,
        latitude: 30.26,
        longitude: 120.14,
        speed: 0,
        direction: 0,
        recordedAt: minutes(15)
      }
    ].filter(Boolean) as Array<Partial<Position> & { vehicle: Vehicle }>;
    await positionRepo.save(positionPayload);
  } else {
    console.log('Positions already present, skipping.');
  }

  if ((await alarmRepo.count()) === 0) {
    console.log('Creating sample alarm...');
    const firstVehicle = vehicleByVin.get('VNCA1234567890001');
    if (firstVehicle) {
      await alarmRepo.save({
        vehicle: firstVehicle,
        type: 'JT808_ALARM',
        payload: { alarms: ['overspeed'], severity: 'medium' },
        raisedAt: minutes(4)
      });
    }
  } else {
    console.log('Alarms already present, skipping.');
  }

  if ((await dailyRepo.count()) === 0) {
    console.log('Creating daily reports...');
    const dayIso = now.toISOString().slice(0, 10);
    const yesterdayIso = minutes(60 * 24).toISOString().slice(0, 10);
    const twoDaysIso = minutes(60 * 48).toISOString().slice(0, 10);
    const v1 = vehicleByVin.get('VNCA1234567890001');
    const v2 = vehicleByVin.get('VNCA1234567890002');
    const v3 = vehicleByVin.get('VNCA1234567890003');

    const payload = [
      v1 && {
        vehicle: v1,
        reportDate: dayIso,
        totalDistanceKm: 186.4,
        totalStops: 6,
        metadata: { fuelUsedL: 18.2 }
      },
      v2 && {
        vehicle: v2,
        reportDate: yesterdayIso,
        totalDistanceKm: 220.7,
        totalStops: 4,
        metadata: { fuelUsedL: 24.5 }
      },
      v3 && {
        vehicle: v3,
        reportDate: twoDaysIso,
        totalDistanceKm: 35.2,
        totalStops: 9,
        metadata: { fuelUsedL: 5.8 }
      }
    ].filter(Boolean) as Array<Partial<DailyReport> & { vehicle: Vehicle }>;
    await dailyRepo.save(payload);
  } else {
    console.log('Daily reports already present, skipping.');
  }

  if ((await monthlyRepo.count()) === 0) {
    console.log('Creating monthly reports...');
    const month = now.toISOString().slice(0, 7);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);
    const v1 = vehicleByVin.get('VNCA1234567890001');
    const v2 = vehicleByVin.get('VNCA1234567890002');
    const v3 = vehicleByVin.get('VNCA1234567890003');

    const payload = [
      v1 && {
        vehicle: v1,
        reportMonth: month,
        totalDistanceKm: 3120.6,
        activeDays: 24,
        metadata: { averageSpeed: 52.4 }
      },
      v2 && {
        vehicle: v2,
        reportMonth: month,
        totalDistanceKm: 2890.1,
        activeDays: 22,
        metadata: { averageSpeed: 48.1 }
      },
      v3 && {
        vehicle: v3,
        reportMonth: lastMonth,
        totalDistanceKm: 810.9,
        activeDays: 12,
        metadata: { averageSpeed: 33.7 }
      }
    ].filter(Boolean) as Array<Partial<MonthlyReport> & { vehicle: Vehicle }>;
    await monthlyRepo.save(payload);
  } else {
    console.log('Monthly reports already present, skipping.');
  }

  if ((await weeklyRepo.count()) === 0) {
    console.log('Creating weekly reports...');
    const currentWeekStart = startOfISOWeek(now);
    const currentWeekEnd = endOfISOWeek(now);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = endOfISOWeek(previousWeekStart);

    const weeklyPayload = [
      vehicleByVin.get('VNCA1234567890001') && {
        vehicle: vehicleByVin.get('VNCA1234567890001')!,
        reportWeek: isoWeekLabel(now),
        weekStart: formatDate(currentWeekStart),
        weekEnd: formatDate(currentWeekEnd),
        totalDistanceKm: 780.4,
        totalTrips: 42,
        metadata: { uptimeHours: 58 }
      },
      vehicleByVin.get('VNCA1234567890002') && {
        vehicle: vehicleByVin.get('VNCA1234567890002')!,
        reportWeek: isoWeekLabel(previousWeekStart),
        weekStart: formatDate(previousWeekStart),
        weekEnd: formatDate(previousWeekEnd),
        totalDistanceKm: 652.1,
        totalTrips: 38,
        metadata: { uptimeHours: 51 }
      }
    ].filter(Boolean) as Array<Partial<WeeklyReport> & { vehicle: Vehicle }>;

    if (weeklyPayload.length > 0) {
      await weeklyRepo.save(weeklyPayload);
    }
  } else {
    console.log('Weekly reports already present, skipping.');
  }

  if ((await yearlyRepo.count()) === 0) {
    console.log('Creating yearly reports...');
    const currentYear = String(now.getFullYear());
    const previousYear = String(now.getFullYear() - 1);

    const yearlyPayload = [
      vehicleByVin.get('VNCA1234567890001') && {
        vehicle: vehicleByVin.get('VNCA1234567890001')!,
        reportYear: currentYear,
        totalDistanceKm: 36850.2,
        activeMonths: 11,
        metadata: { fuelUsedL: 3980 }
      },
      vehicleByVin.get('VNCA1234567890003') && {
        vehicle: vehicleByVin.get('VNCA1234567890003')!,
        reportYear: previousYear,
        totalDistanceKm: 15210.4,
        activeMonths: 7,
        metadata: { fuelUsedL: 1650 }
      }
    ].filter(Boolean) as Array<Partial<YearlyReport> & { vehicle: Vehicle }>;

    if (yearlyPayload.length > 0) {
      await yearlyRepo.save(yearlyPayload);
    }
  } else {
    console.log('Yearly reports already present, skipping.');
  }

  console.log('Seed data ready.');
};

seed()
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
