// middleware/requestLogger.middleware.js
// Logs every request with method, URL, status, duration, and userId.
// 5xx → error level, 4xx → warn level, rest → info level.
// Add early in your middleware stack in server.js.
import { logger } from '../utils/logger.js';

// Never write auth tokens carried in query strings (e.g. Vapi webhook tokens) to logs.
const redactUrl = (url) => url.replace(/([?&]token=)[^&]*/g, '$1[REDACTED]');

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level    = res.statusCode >= 500 ? 'error'
                   : res.statusCode >= 400 ? 'warn'
                   : 'info';

    logger[level]({
      method:      req.method,
      url:         redactUrl(req.url),
      status:      res.statusCode,
      duration_ms: duration,
      userId:      req.user?.id ?? 'anon',
    }, 'Request');
  });

  next();
};
