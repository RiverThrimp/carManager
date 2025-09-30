import type { Request, Response } from 'express';
import { TrackService } from '../services/track.service';

export class TrackController {
  private readonly service = new TrackService();

  history = async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const { start, end } = req.query;
    const positions = await this.service.getHistory(vehicleId, String(start ?? ''), String(end ?? ''));
    res.json(positions);
  };

  latest = async (req: Request, res: Response) => {
    const limit = Number(req.query.limit ?? 20);
    const positions = await this.service.getLatest(limit);
    res.json(positions);
  };
}
