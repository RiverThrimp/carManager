import type { Request, Response } from 'express';
import { MapMatchingService } from '../services/map-matching.service';

export class HealthController {
  private readonly mapMatching = new MapMatchingService();

  check = async (_req: Request, res: Response) => {
    const status = this.mapMatching.getStatus();

    res.json({
      status: 'ok',
      services: {
        mapMatching: status
      }
    });
  };
}