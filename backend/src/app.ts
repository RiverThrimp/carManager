import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/error-handler';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));
  app.use(json());
  app.use(urlencoded({ extended: true }));

  registerRoutes(app);
  app.use(errorHandler);

  return app;
};
