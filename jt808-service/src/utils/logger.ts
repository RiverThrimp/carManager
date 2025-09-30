import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: format.combine(format.timestamp(), format.printf(({ level, message, timestamp, ...meta }) => {
    const rest = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}] ${message} ${rest}`.trim();
  })),
  transports: [new transports.Console()]
});
