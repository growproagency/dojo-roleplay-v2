import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import monthlyReportsRoutes from '../src/routes/monthlyReports.routes.js';
import { monthlyReportsService } from '../src/services/monthlyReports.service.js';
import { errorHandler } from '../src/middleware/error.middleware.js';

test('report endpoints enforce admin access, validate inputs, and ignore client school overrides', async t => {
  let actor = { id: 1, schoolId: 7, role: 'school_admin' };
  const requests = [];
  for (const method of ['list', 'detail', 'updateSettings']) {
    t.mock.method(monthlyReportsService, method, async args => { requests.push({ method, ...args }); return { data: [] }; });
  }
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = actor; next(); });
  app.use('/api/monthly-reports', monthlyReportsRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}/api/monthly-reports`;

  actor = { id: 2, schoolId: 7, role: 'staff' };
  assert.equal((await fetch(base)).status, 403);
  actor = null;
  assert.equal((await fetch(base)).status, 401);
  assert.equal(requests.length, 0);
  actor = { id: 1, schoolId: 7, role: 'school_admin' };

  assert.equal((await fetch(`${base}?month=2026-10&schoolId=999&userId=999`)).status, 200);
  assert.equal(requests[0].schoolId, 7);
  assert.equal(requests[0].month, '2026-10');
  assert.equal(requests[0].userId, undefined);
  assert.equal((await fetch(`${base}/abc?month=2026-10`)).status, 400);
  assert.equal((await fetch(`${base}?month=2026-13`)).status, 400);
  assert.equal((await fetch(`${base}?limit=1000`)).status, 400);
  assert.equal((await fetch(`${base}/3?month=2026-10`)).status, 200);
  assert.equal(requests[1].userId, 3);
  assert.equal(requests[1].schoolId, 7);

  const invalid = await fetch(`${base}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timezone: 'Invalid/Zone' }) });
  assert.equal(invalid.status, 400);
  const valid = await fetch(`${base}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timezone: 'Asia/Manila', schoolId: 999 }) });
  assert.equal(valid.status, 200);
  assert.equal(requests[2].timezone, 'Asia/Manila');
  assert.equal(requests[2].schoolId, 7);
});
