import { insertSystemEvent, findSystemEventById, findSystemEvents, resolveSystemEvent } from '../db/systemEvents.queries.js';
import { logger } from '../utils/logger.js';

const ALLOWED_STATUSES = new Set(['open', 'resolved']);
const ALLOWED_SEVERITIES = new Set(['info', 'warning', 'error', 'critical']);

export async function recordSystemEvent(fields) {
  try {
    if (!fields?.source || !fields?.eventType || !fields?.message) return null;
    return await insertSystemEvent(fields);
  } catch (err) {
    logger.warn({ err, source: fields?.source, eventType: fields?.eventType }, 'Failed to record system event');
    return null;
  }
}

export async function listSystemEvents(filters = {}) {
  const status = ALLOWED_STATUSES.has(filters.status) ? filters.status : undefined;
  const severity = ALLOWED_SEVERITIES.has(filters.severity) ? filters.severity : undefined;
  return findSystemEvents({
    status,
    severity,
    source: filters.source || undefined,
    schoolId: Number.isInteger(filters.schoolId) ? filters.schoolId : undefined,
    callId: Number.isInteger(filters.callId) ? filters.callId : undefined,
    limit: filters.limit,
  });
}

export async function getSystemEvent(id) {
  const event = await findSystemEventById(id);
  if (!event) throw new Error('NOT_FOUND');
  return event;
}

export async function markSystemEventResolved(id) {
  const event = await findSystemEventById(id);
  if (!event) throw new Error('NOT_FOUND');
  await resolveSystemEvent(id);
  return findSystemEventById(id);
}
