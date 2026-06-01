import { supabase } from '../db/supabase.js';
import { findUserByEmail, upsertUser } from '../db/users.queries.js';
import { logger } from '../utils/logger.js';

export const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }

  const token = header.split(' ')[1];
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

  if (error || !supabaseUser) {
    logger.warn({ error: error?.message }, 'Auth token rejected');
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }

  try {
    let user = await findUserByEmail(supabaseUser.email);
    if (!user) {
      await upsertUser({
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        supabaseAuthId: supabaseUser.id,
        lastSignedIn: new Date(),
      });
      user = await findUserByEmail(supabaseUser.email);
    } else {
      await upsertUser({ email: supabaseUser.email, supabaseAuthId: supabaseUser.id, lastSignedIn: new Date() });
    }

    req.user = user;

    if (isGlobalAdmin(user)) {
      const raw = req.header('x-viewing-school-id');
      const parsed = raw ? parseInt(raw, 10) : NaN;
      req.viewingSchoolId = Number.isFinite(parsed) ? parsed : null;
    } else {
      req.viewingSchoolId = null;
    }
  } catch (err) {
    logger.error({ err }, 'Auth DB lookup failed');
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Auth lookup failed' } });
  }

  next();
};

export function effectiveSchoolId(req) {
  return req.viewingSchoolId ?? req.user?.schoolId ?? null;
}

function isGlobalAdmin(user) {
  return user?.role === 'global_admin' || user?.role === 'admin';
}

export function requireGlobalAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  if (!isGlobalAdmin(req.user)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Global admin required' } });
  next();
}

export function requireSchoolAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  if (req.user.role !== 'school_admin' && !isGlobalAdmin(req.user)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'School admin required' } });
  }
  next();
}
