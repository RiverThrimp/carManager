import { Router } from 'express';
import { TrackController } from '../controllers/track.controller';

const controller = new TrackController();
export const trackRouter = Router();

trackRouter.get('/latest', controller.latest);
trackRouter.get('/:vehicleId', controller.history);
