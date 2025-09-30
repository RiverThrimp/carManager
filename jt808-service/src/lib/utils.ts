export const unescapeJT808 = (payload: Buffer) => {
  const result: number[] = [];
  for (let i = 0; i < payload.length; i += 1) {
    if (payload[i] === 0x7d) {
      const next = payload[i + 1];
      if (next === 0x02) {
        result.push(0x7e);
      } else if (next === 0x01) {
        result.push(0x7d);
      }
      i += 1;
    } else {
      result.push(payload[i]);
    }
  }
  return Buffer.from(result);
};

export const escapeJT808 = (payload: Buffer) => {
  const result: number[] = [];
  for (const byte of payload) {
    if (byte === 0x7e) {
      result.push(0x7d, 0x02);
    } else if (byte === 0x7d) {
      result.push(0x7d, 0x01);
    } else {
      result.push(byte);
    }
  }
  return Buffer.from(result);
};

export const verifyChecksum = (payload: Buffer) => {
  if (payload.length < 2) {
    return false;
  }
  let checksum = payload[0];
  for (let i = 1; i < payload.length - 1; i += 1) {
    checksum ^= payload[i];
  }
  return checksum === payload[payload.length - 1];
};

export const computeChecksum = (payload: Buffer) => {
  return payload.reduce((acc, byte) => acc ^ byte, 0);
};

export const readBcd = (buffer: Buffer) => buffer.toString('hex');

export const writeBcd = (value: string, length: number) => {
  const normalized = value.padStart(length * 2, '0');
  return Buffer.from(normalized, 'hex');
};

export const readLatLon = (buffer: Buffer) => buffer.readUIntBE(0, 4) / 1_000_000;
