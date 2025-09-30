import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const controller = new ReportController();
export const reportRouter = Router();

reportRouter.get('/daily', controller.daily);
reportRouter.get('/daily/export', controller.exportDaily);
reportRouter.get('/weekly', controller.weekly);
reportRouter.get('/weekly/export', controller.exportWeekly);
reportRouter.get('/monthly', controller.monthly);
reportRouter.get('/monthly/export', controller.exportMonthly);
reportRouter.get('/yearly', controller.yearly);
reportRouter.get('/yearly/export', controller.exportYearly);
