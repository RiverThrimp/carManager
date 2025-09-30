import type { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';

export class VehicleController {
  private readonly service = new VehicleService();

  list = async (_req: Request, res: Response) => {
    const vehicles = await this.service.list();
    res.json(vehicles);
  };

  create = async (req: Request, res: Response) => {
    const vehicle = await this.service.create(req.body);
    res.status(201).json(vehicle);
  };

  update = async (req: Request, res: Response) => {
    const vehicle = await this.service.update(req.params.id, req.body);
    res.json(vehicle);
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id);
    res.status(204).end();
  };
}
