import { config } from '../config/env.js';
import { insertAutomationEvent, updateAutomationEvent } from '../db/automationEvents.queries.js';
import { findOpenInviteBySchoolAndEmail, insertInvite, updateInvite } from '../db/invites.queries.js';
import { findSchoolBySlug, insertSchool, updateSchool } from '../db/schools.queries.js';
import { normalizePlan } from '../utils/plans.js';

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getInviteeName(payload) {
  return (payload.fullName || payload.ownerName || '').trim() || null;
}

function buildInviteLink(token) {
  return `${config.frontendUrl.replace(/\/$/, '')}/invite/${token}`;
}

function getExternalId(payload) {
  return payload.externalId || payload.paymentId || payload.highLevelContactId || null;
}

export async function processHighLevelPaymentCompleted(payload) {
  const event = await insertAutomationEvent({
    source: 'highlevel',
    eventType: 'payment_completed',
    externalId: getExternalId(payload),
    payload,
    status: 'received',
  });

  try {
    const email = normalizeEmail(payload.email);
    const schoolSlug = slugify(payload.schoolName);
    const plan = normalizePlan(payload.plan);
    if (!schoolSlug) throw new Error('VALIDATION');

    let school = await findSchoolBySlug(schoolSlug);
    if (!school) {
      school = await insertSchool({
        name: payload.schoolName,
        slug: schoolSlug,
        plan,
      });
    } else if (plan && school.plan !== plan) {
      await updateSchool(school.id, { plan });
      school = { ...school, plan };
    }

    const inviteeName = getInviteeName(payload);
    let invite = await findOpenInviteBySchoolAndEmail(school.id, email);
    if (!invite) {
      invite = await insertInvite({
        schoolId: school.id,
        email,
        fullName: inviteeName,
        role: 'school_admin',
        invitedBy: null,
      });
    } else if (inviteeName && !invite.fullName) {
      await updateInvite(invite.id, { fullName: inviteeName });
      invite = { ...invite, fullName: inviteeName };
    }

    await updateAutomationEvent(event.id, {
      status: 'processed',
      schoolId: school.id,
      inviteId: invite.id,
    });

    return { inviteLink: buildInviteLink(invite.token) };
  } catch (err) {
    await updateAutomationEvent(event.id, {
      status: 'failed',
      errorMessage: err.message,
    }).catch(() => {});
    throw err;
  }
}
