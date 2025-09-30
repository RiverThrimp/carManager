import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';

const controller = new DriverController();
export const driverRouter = Router();

driverRouter.get('/', controller.list);
driverRouter.post('/', controller.create);
driverRouter.put('/:id', controller.update);
