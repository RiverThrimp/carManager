import type { Request, Response } from 'express';
import { AlarmService } from '../services/alarm.service';

export class AlarmController {
  private readonly service = new AlarmService();

  list = async (req: Request, res: Response) => {
    const limit = Number(req.query.limit ?? 100);
    const alarms = await this.service.list(limit);
    res.json(alarms);
  };

  ingest = async (req: Request, res: Response) => {
    const alarm = await this.service.ingest(req.body);
    res.status(201).json(alarm);
  };
}
