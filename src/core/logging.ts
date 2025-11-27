import pino from 'pino';

export function createLogger(level: 'debug' | 'info' | 'warn' | 'error') {
  return pino({
    level,
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  });
}
