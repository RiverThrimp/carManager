import type { Request, Response } from 'express';
import { PositionService } from '../services/position.service';

export class PositionController {
  private readonly service = new PositionService();

  ingest = async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const position = await this.service.ingest(vehicleId, req.body);
    res.status(201).json(position);
  };
}
