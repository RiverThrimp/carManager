import 'dotenv/config';
import { JT808Server } from './transport/jt808-server';
import { logger } from './utils/logger';

const port = Number(process.env.TCP_PORT ?? 6808);

const server = new JT808Server(port);
server.start();

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception %o', error);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection %o', error);
});
