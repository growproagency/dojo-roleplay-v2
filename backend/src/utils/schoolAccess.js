export function getSchoolAccessStatus(school) {
  if (!school) return { allowed: true, reason: null };
  if (school.archivedAt) return { allowed: false, reason: 'archived' };

  const status = school.subscriptionStatus || 'active';
  if (status === 'active' || status === 'trialing') return { allowed: true, reason: null };

  if (status === 'past_due' && school.accessGraceUntil) {
    const graceUntil = new Date(school.accessGraceUntil);
    if (!Number.isNaN(graceUntil.getTime()) && graceUntil > new Date()) {
      return { allowed: true, reason: null };
    }
  }

  return { allowed: false, reason: status };
}

export function assertSchoolAccess(school) {
  const access = getSchoolAccessStatus(school);
  if (!access.allowed) throw new Error('SCHOOL_ACCESS_DISABLED');
  return access;
}
