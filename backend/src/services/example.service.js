// services/example.service.js
// Business logic layer — no HTTP knowledge (no req, no res, no status codes).
// Receives plain arguments, returns plain data.
// Services call db/queries — never the other way around.
//
// This is the layer you unit test most aggressively.
// Replace "example" with your resource name.
import * as exampleQueries from '../db/example.queries.js';

export const getAll = async ({ page = 1, limit = 20 }) => {
  const safeLimit = Math.min(limit, 100); // cap at 100 — never unbounded
  const offset    = (page - 1) * safeLimit;

  const { data, count } = await exampleQueries.findAll({ limit: safeLimit, offset });

  return {
    data,
    meta: {
      total:      count,
      page,
      limit:      safeLimit,
      totalPages: Math.ceil(count / safeLimit),
      hasNext:    offset + safeLimit < count,
    },
  };
};

export const getById = async (id) => {
  const record = await exampleQueries.findById(id);
  if (!record) throw new Error('NOT_FOUND');
  return record;
};

export const create = async (userId, body) => {
  return exampleQueries.insert({ ...body, user_id: userId });
};

export const update = async (userId, id, updates) => {
  // Business rule: verify ownership before allowing update
  const record = await exampleQueries.findById(id);
  if (!record)               throw new Error('NOT_FOUND');
  if (record.user_id !== userId) throw new Error('FORBIDDEN');

  return exampleQueries.update(id, updates);
};

export const remove = async (userId, id) => {
  // Business rule: verify ownership before allowing delete
  const record = await exampleQueries.findById(id);
  if (!record)               throw new Error('NOT_FOUND');
  if (record.user_id !== userId) throw new Error('FORBIDDEN');

  await exampleQueries.remove(id);
};
