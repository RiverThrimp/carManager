import 'dotenv/config';
import 'reflect-metadata';
import http from 'http';
import { Server } from 'socket.io';
import { AppDataSource } from './config/data-source';
import { createApp } from './app';
import { registerSocketHandlers } from './services/socket.service';
import { UserService } from './services/user.service';

const bootstrap = async () => {
  const port = Number(process.env.APP_PORT ?? 4000);
  const host = process.env.APP_HOST ?? '0.0.0.0';

  await AppDataSource.initialize();
  await new UserService().createDefaultAdmin();

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

  registerSocketHandlers(io);

  httpServer.listen(port, host, () => {
    console.log(`API listening at http://${host}:${port}`);
  });
};

bootstrap().catch((error) => {
  console.error('Failed to bootstrap API', error);
  process.exit(1);
});
