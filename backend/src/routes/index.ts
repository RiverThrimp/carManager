import type { Express } from 'express';
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { vehicleRouter } from './vehicle.routes';
import { driverRouter } from './driver.routes';
import { trackRouter } from './track.routes';
import { reportRouter } from './report.routes';
import { alarmRouter } from './alarm.routes';
import { positionRouter } from './position.routes';

export const registerRoutes = (app: Express) => {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.use('/auth', authRouter);
  router.use('/vehicles', vehicleRouter);
  router.use('/drivers', driverRouter);
  router.use('/track', trackRouter);
  router.use('/positions', positionRouter);
  router.use('/report', reportRouter);
  router.use('/alarm', alarmRouter);

  app.use('/api', router);
};
