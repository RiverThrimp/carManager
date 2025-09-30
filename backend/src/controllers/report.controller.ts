import type { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  private readonly service = new ReportService();

  daily = async (req: Request, res: Response) => {
    const date = String(req.query.date ?? '');
    const data = await this.service.getDaily(date);
    res.json(data);
  };

  monthly = async (req: Request, res: Response) => {
    const month = String(req.query.month ?? '');
    const data = await this.service.getMonthly(month);
    res.json(data);
  };

  weekly = async (req: Request, res: Response) => {
    const week = String(req.query.week ?? '');
    const data = await this.service.getWeekly(week);
    res.json(data);
  };

  yearly = async (req: Request, res: Response) => {
    const year = String(req.query.year ?? '');
    const data = await this.service.getYearly(year);
    res.json(data);
  };

  exportDaily = async (req: Request, res: Response) => {
    const date = String(req.query.date ?? '');
    const data = await this.service.getDaily(date);
    this.sendCsv(
      res,
      `daily-report${date ? `-${date}` : ''}.csv`,
      ['日期', '车辆', '里程(km)', '停车次数'],
      data.map((item) => [
        item.reportDate,
        item.vehicle?.plateNumber ?? '',
        item.totalDistanceKm.toString(),
        item.totalStops.toString()
      ])
    );
  };

  exportWeekly = async (req: Request, res: Response) => {
    const week = String(req.query.week ?? '');
    const data = await this.service.getWeekly(week);
    this.sendCsv(
      res,
      `weekly-report${week ? `-${week}` : ''}.csv`,
      ['周次', '车辆', '周起始', '周结束', '里程(km)', '行程数'],
      data.map((item) => [
        item.reportWeek,
        item.vehicle?.plateNumber ?? '',
        item.weekStart,
        item.weekEnd,
        item.totalDistanceKm.toString(),
        item.totalTrips.toString()
      ])
    );
  };

  exportMonthly = async (req: Request, res: Response) => {
    const month = String(req.query.month ?? '');
    const data = await this.service.getMonthly(month);
    this.sendCsv(
      res,
      `monthly-report${month ? `-${month}` : ''}.csv`,
      ['月份', '车辆', '里程(km)', '出勤天数'],
      data.map((item) => [
        item.reportMonth,
        item.vehicle?.plateNumber ?? '',
        item.totalDistanceKm.toString(),
        item.activeDays.toString()
      ])
    );
  };

  exportYearly = async (req: Request, res: Response) => {
    const year = String(req.query.year ?? '');
    const data = await this.service.getYearly(year);
    this.sendCsv(
      res,
      `yearly-report${year ? `-${year}` : ''}.csv`,
      ['年份', '车辆', '里程(km)', '活跃月份'],
      data.map((item) => [
        item.reportYear,
        item.vehicle?.plateNumber ?? '',
        item.totalDistanceKm.toString(),
        item.activeMonths.toString()
      ])
    );
  };

  private sendCsv(res: Response, filename: string, headers: string[], rows: string[][]) {
    const escapeCell = (value: string) => {
      const safe = value ?? '';
      if (/[,"\n]/.test(safe)) {
        return `"${safe.replace(/"/g, '""')}"`;
      }
      return safe;
    };

    const csvLines = [headers.map(escapeCell).join(',')];
    for (const row of rows) {
      csvLines.push(row.map(escapeCell).join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvLines.join('\n'));
  }
}
