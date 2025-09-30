import type { Server as SocketIOServer } from 'socket.io';

class SocketManager {
  private io?: SocketIOServer;

  setServer(io: SocketIOServer) {
    this.io = io;
  }

  broadcast<T>(event: string, payload: T) {
    this.io?.emit(event, payload);
  }
}

export const SocketGateway = new SocketManager();

export const registerSocketHandlers = (io: SocketIOServer) => {
  SocketGateway.setServer(io);
  io.on('connection', (socket) => {
    console.log('Socket client connected', socket.id);
  });
};
