import { Router } from 'express';
import { AlarmController } from '../controllers/alarm.controller';

const controller = new AlarmController();
export const alarmRouter = Router();

alarmRouter.get('/', controller.list);
alarmRouter.post('/', controller.ingest);
