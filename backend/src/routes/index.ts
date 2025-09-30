import type { Express } from 'express';
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { vehicleRouter } from './vehicle.routes';
import { driverRouter } from './driver.routes';
import { trackRouter } from './track.routes';
import { reportRouter } from './report.routes';
import { alarmRouter } from './alarm.routes';
import { positionRouter } from './position.routes';
import { authenticate } from '../middleware/auth.middleware';

export const registerRoutes = (app: Express) => {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.use('/auth', authRouter);

  // Protected routes - require authentication
  router.use('/vehicles', authenticate, vehicleRouter);
  router.use('/drivers', authenticate, driverRouter);
  router.use('/track', authenticate, trackRouter);
  router.use('/positions', authenticate, positionRouter);
  router.use('/report', authenticate, reportRouter);
  router.use('/alarm', authenticate, alarmRouter);

  app.use('/api', router);
};
