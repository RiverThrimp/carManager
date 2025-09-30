import { AppDataSource } from '../config/data-source';
import { Position } from '../entities/position.entity';
import { Vehicle } from '../entities/vehicle.entity';
import {
  addDays,
  endOfISOWeek,
  formatDate,
  formatMonth,
  formatYear,
  isoWeekLabel,
  startOfISOWeek,
  toEndOfDay,
  toStartOfDay
} from '../shared/date.utils';
import { haversineDistanceKm } from '../shared/geo.utils';

interface VehicleRef {
  id: string;
  plateNumber: string;
}

interface PositionSample {
  vehicle: Vehicle;
  latitude: number;
  longitude: number;
  speed: number;
  recordedAt: Date;
}

interface DailyReportView {
  id: string;
  vehicle: VehicleRef;
  reportDate: string;
  totalDistanceKm: number;
  totalStops: number;
}

interface WeeklyReportView {
  id: string;
  vehicle: VehicleRef;
  reportWeek: string;
  weekStart: string;
  weekEnd: string;
  totalDistanceKm: number;
  totalTrips: number;
}

interface MonthlyReportView {
  id: string;
  vehicle: VehicleRef;
  reportMonth: string;
  totalDistanceKm: number;
  activeDays: number;
}

interface YearlyReportView {
  id: string;
  vehicle: VehicleRef;
  reportYear: string;
  totalDistanceKm: number;
  activeMonths: number;
}

type DailyAccumulator = DailyReportView & {
  _lastLat?: number;
  _lastLon?: number;
};

type WeeklyAccumulator = WeeklyReportView & {
  _lastLat?: number;
  _lastLon?: number;
  _lastSpeed?: number;
};

type MonthlyAccumulator = MonthlyReportView & {
  _lastLat?: number;
  _lastLon?: number;
  _activeDays: Set<string>;
};

type YearlyAccumulator = YearlyReportView & {
  _lastLat?: number;
  _lastLon?: number;
  _activeMonths: Set<string>;
};

export class ReportService {
  private readonly positionRepo = AppDataSource.getRepository(Position);

  async getDaily(date?: string): Promise<DailyReportView[]> {
    const { start, end } = date
      ? {
          start: toStartOfDay(new Date(date)),
          end: toEndOfDay(new Date(date))
        }
      : {
          start: toStartOfDay(addDays(new Date(), -29)),
          end: toEndOfDay(new Date())
        };

    const positions = await this.loadPositions(start, end);
    if (!positions.length) {
      return [];
    }

    const byKey = new Map<string, DailyAccumulator>();

    for (const sample of positions) {
      const dayKey = formatDate(sample.recordedAt);
      const key = `${sample.vehicle.id}-${dayKey}`;
      let acc = byKey.get(key);

      if (!acc) {
        acc = {
          id: key,
          vehicle: this.pickVehicle(sample.vehicle),
          reportDate: dayKey,
          totalDistanceKm: 0,
          totalStops: 0
        };
        byKey.set(key, acc);
      }

      if (acc._lastLat !== undefined && acc._lastLon !== undefined) {
        acc.totalDistanceKm += haversineDistanceKm(
          acc._lastLat,
          acc._lastLon,
          sample.latitude,
          sample.longitude
        );
      }

      acc._lastLat = sample.latitude;
      acc._lastLon = sample.longitude;

      if (sample.speed <= 1) {
        acc.totalStops += 1;
      }
    }

    return Array.from(byKey.values())
      .map((entry) => ({
        id: entry.id,
        vehicle: entry.vehicle,
        reportDate: entry.reportDate,
        totalDistanceKm: Number(entry.totalDistanceKm.toFixed(2)),
        totalStops: entry.totalStops
      }))
      .sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1));
  }

  async getWeekly(week?: string): Promise<WeeklyReportView[]> {
    const reference = week ? this.parseWeekToDate(week) : new Date();
    const end = toEndOfDay(endOfISOWeek(reference));
    const start = toStartOfDay(addDays(startOfISOWeek(reference), week ? 0 : -7 * 11));

    const positions = await this.loadPositions(start, end);
    if (!positions.length) {
      return [];
    }

    const byKey = new Map<string, WeeklyAccumulator>();

    for (const sample of positions) {
      const label = isoWeekLabel(sample.recordedAt);
      const weekStart = startOfISOWeek(sample.recordedAt);
      const weekEnd = endOfISOWeek(sample.recordedAt);
      const key = `${sample.vehicle.id}-${label}`;

      let acc = byKey.get(key);
      if (!acc) {
        acc = {
          id: key,
          vehicle: this.pickVehicle(sample.vehicle),
          reportWeek: label,
          weekStart: formatDate(weekStart),
          weekEnd: formatDate(weekEnd),
          totalDistanceKm: 0,
          totalTrips: 0
        };
        byKey.set(key, acc);
      }

      if (acc._lastLat !== undefined && acc._lastLon !== undefined) {
        acc.totalDistanceKm += haversineDistanceKm(
          acc._lastLat,
          acc._lastLon,
          sample.latitude,
          sample.longitude
        );
      }

      if (sample.speed > 1 && (!acc._lastSpeed || acc._lastSpeed <= 1)) {
        acc.totalTrips += 1;
      }

      acc._lastLat = sample.latitude;
      acc._lastLon = sample.longitude;
      acc._lastSpeed = sample.speed;
    }

    return Array.from(byKey.values())
      .map((entry) => ({
        id: entry.id,
        vehicle: entry.vehicle,
        reportWeek: entry.reportWeek,
        weekStart: entry.weekStart,
        weekEnd: entry.weekEnd,
        totalDistanceKm: Number(entry.totalDistanceKm.toFixed(2)),
        totalTrips: entry.totalTrips
      }))
      .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  }

  async getMonthly(month?: string): Promise<MonthlyReportView[]> {
    const reference = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
    const start = month
      ? toStartOfDay(new Date(reference.getFullYear(), reference.getMonth(), 1))
      : toStartOfDay(new Date(reference.getFullYear(), reference.getMonth() - 11, 1));
    const end = month
      ? toEndOfDay(new Date(reference.getFullYear(), reference.getMonth() + 1, 0))
      : toEndOfDay(new Date(reference.getFullYear(), reference.getMonth() + 1, 0));

    const positions = await this.loadPositions(start, end);
    if (!positions.length) {
      return [];
    }

    const byKey = new Map<string, MonthlyAccumulator>();

    for (const sample of positions) {
      const monthKey = formatMonth(sample.recordedAt);
      const dayKey = formatDate(sample.recordedAt);
      const key = `${sample.vehicle.id}-${monthKey}`;

      let acc = byKey.get(key);
      if (!acc) {
        acc = {
          id: key,
          vehicle: this.pickVehicle(sample.vehicle),
          reportMonth: monthKey,
          totalDistanceKm: 0,
          activeDays: 0,
          _activeDays: new Set<string>()
        };
        byKey.set(key, acc);
      }

      if (acc._lastLat !== undefined && acc._lastLon !== undefined) {
        acc.totalDistanceKm += haversineDistanceKm(
          acc._lastLat,
          acc._lastLon,
          sample.latitude,
          sample.longitude
        );
      }

      acc._lastLat = sample.latitude;
      acc._lastLon = sample.longitude;
      acc._activeDays.add(dayKey);
    }

    return Array.from(byKey.values())
      .map((entry) => ({
        id: entry.id,
        vehicle: entry.vehicle,
        reportMonth: entry.reportMonth,
        totalDistanceKm: Number(entry.totalDistanceKm.toFixed(2)),
        activeDays: entry._activeDays.size
      }))
      .sort((a, b) => (a.reportMonth < b.reportMonth ? 1 : -1));
  }

  async getYearly(year?: string): Promise<YearlyReportView[]> {
    const referenceYear = year ? Number.parseInt(year, 10) : new Date().getFullYear();
    const startYear = year ? referenceYear : referenceYear - 4;
    const start = toStartOfDay(new Date(startYear, 0, 1));
    const end = toEndOfDay(new Date(referenceYear, 11, 31));

    const positions = await this.loadPositions(start, end);
    if (!positions.length) {
      return [];
    }

    const byKey = new Map<string, YearlyAccumulator>();

    for (const sample of positions) {
      const yearKey = formatYear(sample.recordedAt);
      const monthKey = formatMonth(sample.recordedAt);
      const key = `${sample.vehicle.id}-${yearKey}`;

      let acc = byKey.get(key);
      if (!acc) {
        acc = {
          id: key,
          vehicle: this.pickVehicle(sample.vehicle),
          reportYear: yearKey,
          totalDistanceKm: 0,
          activeMonths: 0,
          _activeMonths: new Set<string>()
        };
        byKey.set(key, acc);
      }

      if (acc._lastLat !== undefined && acc._lastLon !== undefined) {
        acc.totalDistanceKm += haversineDistanceKm(
          acc._lastLat,
          acc._lastLon,
          sample.latitude,
          sample.longitude
        );
      }

      acc._lastLat = sample.latitude;
      acc._lastLon = sample.longitude;
      acc._activeMonths.add(monthKey);
    }

    return Array.from(byKey.values())
      .map((entry) => ({
        id: entry.id,
        vehicle: entry.vehicle,
        reportYear: entry.reportYear,
        totalDistanceKm: Number(entry.totalDistanceKm.toFixed(2)),
        activeMonths: entry._activeMonths.size
      }))
      .sort((a, b) => (a.reportYear < b.reportYear ? 1 : -1));
  }

  private pickVehicle(vehicle: Vehicle): VehicleRef {
    return {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber
    };
  }

  private parseWeekToDate(label: string) {
    const [yearPart, weekPart] = label.split('-W');
    const year = Number.parseInt(yearPart, 10);
    const week = Number.parseInt(weekPart, 10);
    const temp = new Date(Date.UTC(year, 0, 1));
    const day = temp.getUTCDay() || 7;
    const dayOffset = day <= 4 ? day - 1 : day - 8;
    temp.setUTCDate(temp.getUTCDate() - dayOffset + (week - 1) * 7);
    return new Date(temp);
  }

  private async loadPositions(start: Date, end: Date): Promise<PositionSample[]> {
    const rows = await this.positionRepo
      .createQueryBuilder('position')
      .leftJoinAndSelect('position.vehicle', 'vehicle')
      .where('position.recordedAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString()
      })
      .orderBy('vehicle.id', 'ASC')
      .addOrderBy('position.recordedAt', 'ASC')
      .getMany();

    return rows.map((row) => ({
      vehicle: row.vehicle,
      latitude: row.latitude,
      longitude: row.longitude,
      speed: row.speed,
      recordedAt: row.recordedAt
    }));
  }
}
