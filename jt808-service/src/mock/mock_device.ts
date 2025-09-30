import net from 'net';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const DEVICE_ID = '013812345678';

const buildPositionFrame = () => {
  const body = Buffer.alloc(28);
  body.writeUInt32BE(0, 0); // alarm
  body.writeUInt32BE(0, 4); // status
  body.writeUInt32BE(Math.floor(30.2765 * 1_000_000), 8);
  body.writeUInt32BE(Math.floor(120.1234 * 1_000_000), 12);
  body.writeUInt16BE(350, 16); // speed 35 km/h
  body.writeUInt16BE(90, 18); // direction

  const timestamp = dayjs().utc().format('YYMMDDHHmmss');
  Buffer.from(timestamp, 'hex').copy(body, 20);

  const header = Buffer.alloc(12);
  header.writeUInt16BE(0x0200, 0);
  header.writeUInt16BE(body.length, 2);
  Buffer.from(DEVICE_ID, 'hex').copy(header, 4, 0, 6);
  header.writeUInt16BE(1, 10);

  const message = Buffer.concat([header, body]);
  const checksum = message.reduce((acc, byte) => acc ^ byte, 0);
  const frame = Buffer.concat([Buffer.from([0x7e]), message, Buffer.from([checksum]), Buffer.from([0x7e])]);
  return frame;
};

export const sendMockTelemetry = (host = '127.0.0.1', port = 6808) => {
  const client = new net.Socket();
  client.connect(port, host, () => {
    console.log('Mock device connected');
    setInterval(() => {
      const frame = buildPositionFrame();
      client.write(frame);
    }, 3000);
  });

  client.on('data', (data) => console.log('ACK', data.toString('hex')));
  client.on('error', (error) => console.error('Mock client error', error));
};

if (require.main === module) {
  sendMockTelemetry();
}
