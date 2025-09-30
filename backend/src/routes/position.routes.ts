import { Router } from 'express';
import { PositionController } from '../controllers/position.controller';

const controller = new PositionController();
export const positionRouter = Router();

positionRouter.post('/:vehicleId', controller.ingest);
