// utils/logger.js
// Structured JSON logging with pino.
// In development: pretty-printed with colours.
// In production: JSON lines — readable by Render's log dashboard.
import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.logLevel,
  transport: config.isDevelopment
    ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } }
    : undefined,
});
