import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const TTL_SECONDS = 60 * 30; // 30 minutes

export function createSessionToken({ userId, schoolId }) {
  return jwt.sign(
    { userId, schoolId: schoolId ?? null },
    config.jwtSecret,
    { expiresIn: TTL_SECONDS }
  );
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}
