import { readBcd, readLatLon, unescapeJT808, verifyChecksum } from './utils';

export interface JT808Frame {
  messageId: number;
  phone: string;
  flowId: number;
  body: Buffer;
  flags: {
    encrypted: boolean;
    subPackage: boolean;
  };
}

export interface PositionMessage {
  deviceId: string;
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  time: string;
  status: number;
  alarms: number;
}

export const parseFrame = (raw: Buffer): JT808Frame | null => {
  if (raw[0] !== 0x7e || raw[raw.length - 1] !== 0x7e) {
    return null;
  }

  const payload = unescapeJT808(raw.subarray(1, raw.length - 1));
  if (!verifyChecksum(payload)) {
    return null;
  }

  const messageId = payload.readUInt16BE(0);
  const messageBodyProps = payload.readUInt16BE(2);
  const bodyLength = messageBodyProps & 0x03ff;
  const encrypted = (messageBodyProps & 0x1c00) !== 0;
  const subPackage = (messageBodyProps & 0x2000) !== 0;
  const phone = readBcd(payload.subarray(4, 10));
  const flowId = payload.readUInt16BE(10);
  let offset = 12;

  if (subPackage) {
    offset += 4; // skip package info
  }

  const body = payload.subarray(offset, offset + bodyLength);

  return {
    messageId,
    phone,
    flowId,
    body,
    flags: {
      encrypted,
      subPackage
    }
  };
};

export const parsePosition = (frame: JT808Frame): PositionMessage | null => {
  if (frame.body.length < 28) {
    return null;
  }

  const alarms = frame.body.readUInt32BE(0);
  const status = frame.body.readUInt32BE(4);
  const lat = readLatLon(frame.body.subarray(8, 12));
  const lng = readLatLon(frame.body.subarray(12, 16));
  const speed = frame.body.readUInt16BE(16) / 10;
  const direction = frame.body.readUInt16BE(18);
  const timeHex = frame.body.subarray(20, 26).toString('hex');
  const yy = Number.parseInt(timeHex.slice(0, 2), 10) + 2000;
  const month = timeHex.slice(2, 4);
  const day = timeHex.slice(4, 6);
  const hour = timeHex.slice(6, 8);
  const minute = timeHex.slice(8, 10);
  const second = timeHex.slice(10, 12);
  const isoTime = `${yy}-${month}-${day}T${hour}:${minute}:${second}Z`;

  return {
    deviceId: frame.phone,
    lat,
    lng,
    speed,
    direction,
    time: isoTime,
    status,
    alarms
  };
};

export const parseAuth = (frame: JT808Frame) => frame.body.toString('utf8');

export const parseHeartbeat = () => ({ ok: true });
