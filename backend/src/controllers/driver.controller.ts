import type { Request, Response } from 'express';
import { DriverService } from '../services/driver.service';

export class DriverController {
  private readonly service = new DriverService();

  list = async (_req: Request, res: Response) => {
    res.json(await this.service.list());
  };

  create = async (req: Request, res: Response) => {
    const driver = await this.service.create(req.body);
    res.status(201).json(driver);
  };

  update = async (req: Request, res: Response) => {
    const driver = await this.service.update(req.params.id, req.body);
    res.json(driver);
  };
}
