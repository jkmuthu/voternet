import pino from 'pino';
import { config } from '../config/config.js';

const logLevel = config.get('logging.level');
const isProduction = config.get('env') === 'production';

export const logger = pino({
  level: logLevel,
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined
});
