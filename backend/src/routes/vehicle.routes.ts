import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';

const controller = new VehicleController();
export const vehicleRouter = Router();

vehicleRouter.get('/', controller.list);
vehicleRouter.post('/', controller.create);
vehicleRouter.put('/:id', controller.update);
vehicleRouter.delete('/:id', controller.remove);
