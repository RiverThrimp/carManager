import net from 'net';
import { escapeJT808, computeChecksum, writeBcd } from '../lib/utils';
import { parseFrame, parseHeartbeat, parsePosition, JT808Frame } from '../lib/parser';
import { forwardAlarm, forwardPosition } from '../services/http-forwarder';
import { logger } from '../utils/logger';

export class JT808Server {
  private server: net.Server;

  constructor(private readonly port: number) {
    this.server = net.createServer();
  }

  start() {
    this.server.on('connection', (socket) => {
      const remote = `${socket.remoteAddress}:${socket.remotePort}`;
      logger.info(`Device connected ${remote}`);

      socket.on('data', async (data) => {
        const frame = parseFrame(data);
        if (!frame) {
          logger.warn('Invalid frame from %s', remote);
          return;
        }

        switch (frame.messageId) {
          case 0x0002:
            parseHeartbeat();
            socket.write(this.buildAck(frame, 0));
            break;
          case 0x0102:
            socket.write(this.buildAck(frame, 0));
            break;
          case 0x0200: {
            const position = parsePosition(frame);
            if (position) {
              try {
                await forwardPosition(position);
                await forwardAlarm(position);
              } catch (error) {
                logger.error('Failed to forward position %o', error);
              }
            }
            socket.write(this.buildAck(frame, 0));
            break;
          }
          default:
            logger.debug('Unhandled message %s', frame.messageId.toString(16));
            socket.write(this.buildAck(frame, 0));
        }
      });

      socket.on('close', () => logger.info(`Device disconnected ${remote}`));
      socket.on('error', (error) => logger.error('Socket error %s %o', remote, error));
    });

    this.server.listen(this.port, () => {
      logger.info(`JT/T 808 server listening on ${this.port}`);
    });
  }

  private buildAck(frame: JT808Frame, result: number) {
    const body = Buffer.alloc(5);
    body.writeUInt16BE(frame.flowId, 0);
    body.writeUInt16BE(frame.messageId, 2);
    body.writeUInt8(result, 4);

    const header = Buffer.alloc(12);
    header.writeUInt16BE(0x8001, 0);
    header.writeUInt16BE(body.length, 2);
    writeBcd(frame.phone, 6).copy(header, 4);
    header.writeUInt16BE(frame.flowId, 10);

    const payload = Buffer.concat([header, body]);
    const checksum = computeChecksum(payload);
    const escaped = escapeJT808(Buffer.concat([payload, Buffer.from([checksum])]));
    return Buffer.concat([Buffer.from([0x7e]), escaped, Buffer.from([0x7e])]);
  }
}
