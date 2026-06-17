// middleware/error.middleware.js
// Global error handler — must be the LAST middleware registered in server.js.
// All errors from route handlers and services land here via next(err).
//
// Two audiences:
//   Server logs → full error detail (message, stack, user, url)
//   API response → safe message only, never leak internals in production
//
// Throw named errors anywhere in services:
//   throw new Error('NOT_FOUND')
//   throw new Error('FORBIDDEN')
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

const STATUS_MAP = {
  NOT_FOUND:    404,
  FORBIDDEN:    403,
  UNAUTHORIZED: 401,
  VALIDATION:   400,
  CALL_NOT_SCOREABLE: 400,
  CONFLICT:     409,
  SCHOOL_MEMBER_EXISTS: 409,
  SCHOOL_INVITE_EXISTS: 409,
  PLATFORM_ADMIN_EXISTS: 409,
  PLATFORM_ADMIN_INVITE_EXISTS: 409,
  LAST_PLATFORM_ADMIN: 409,
  USER_ALREADY_IN_SCHOOL: 409,
  USER_BELONGS_TO_ANOTHER_SCHOOL: 409,
  TIMEOUT:      504,
  MEMBER_LIMIT_REACHED: 409,
  MONTHLY_MINUTES_LIMIT_REACHED: 402,
  SCHOOL_ACCESS_DISABLED: 402,
  CUSTOM_SCENARIOS_PLAN_REQUIRED: 403,
};

const MESSAGE_MAP = {
  MEMBER_LIMIT_REACHED: 'This school has reached the member limit for its plan.',
  SCHOOL_MEMBER_EXISTS: 'This email is already a member of this school.',
  SCHOOL_INVITE_EXISTS: 'A pending invite already exists for this email.',
  PLATFORM_ADMIN_EXISTS: 'This email is already a platform admin.',
  PLATFORM_ADMIN_INVITE_EXISTS: 'A pending platform admin invite already exists for this email.',
  LAST_PLATFORM_ADMIN: 'You cannot remove the last platform admin.',
  USER_ALREADY_IN_SCHOOL: 'This user is already a member of this school.',
  USER_BELONGS_TO_ANOTHER_SCHOOL: 'This user already belongs to another school.',
  MONTHLY_MINUTES_LIMIT_REACHED: 'This school has reached its monthly roleplay minute limit.',
  SCHOOL_ACCESS_DISABLED: 'This school does not currently have access. Please contact your administrator.',
  CUSTOM_SCENARIOS_PLAN_REQUIRED: 'Custom scenarios are available on the AIOS plan.',
  CALL_NOT_SCOREABLE: 'This call is too short or does not contain enough conversation to generate a scorecard.',
};

export const errorHandler = (err, req, res, _next) => {
  // Always log the full error server-side
  logger.error({
    err:    { message: err.message, stack: err.stack },
    url:    req.url,
    method: req.method,
    userId: req.user?.id ?? 'anon',
  }, 'Request error');

  const status  = STATUS_MAP[err.message] ?? 500;

  // Never expose internals to the client in production
  const message = status === 500 && config.isProduction
    ? 'Something went wrong. Please try again.'
    : MESSAGE_MAP[err.message] ?? err.message;

  res.status(status).json({
    error: { code: err.message, message, status },
  });
};
