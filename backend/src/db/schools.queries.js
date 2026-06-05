import { supabase } from './supabase.js';

const SCHOOL_COLS = 'id, name, slug, plan, owner_user_id, street_address, city, state, zip_code, intro_offer, price_range_low, price_range_high, program_director_name, additional_notes, usage_cap_usd, member_limit, monthly_roleplay_minutes, usage_period_start, usage_period_end, archived_at, subscription_status, subscription_current_period_end, access_grace_until, created_at, updated_at';

export function toSchool(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    ownerUserId: row.owner_user_id,
    streetAddress: row.street_address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    introOffer: row.intro_offer,
    priceRangeLow: row.price_range_low,
    priceRangeHigh: row.price_range_high,
    programDirectorName: row.program_director_name,
    additionalNotes: row.additional_notes,
    usageCapUsd: row.usage_cap_usd != null ? Number(row.usage_cap_usd) : null,
    memberLimit: row.member_limit,
    monthlyRoleplayMinutes: row.monthly_roleplay_minutes,
    usagePeriodStart: row.usage_period_start,
    usagePeriodEnd: row.usage_period_end,
    archivedAt: row.archived_at,
    subscriptionStatus: row.subscription_status,
    subscriptionCurrentPeriodEnd: row.subscription_current_period_end,
    accessGraceUntil: row.access_grace_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findSchoolById(id) {
  const { data, error } = await supabase
    .from('schools')
    .select(SCHOOL_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return toSchool(data);
}

export async function findSchoolBySlug(slug) {
  const { data, error } = await supabase
    .from('schools')
    .select(SCHOOL_COLS)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return toSchool(data);
}

export async function findAllSchools({ includeArchived = false, archivedOnly = false } = {}) {
  let query = supabase
    .from('schools')
    .select(SCHOOL_COLS)
    .order('name', { ascending: true })
    .limit(100);
  if (archivedOnly) query = query.not('archived_at', 'is', null);
  else if (!includeArchived) query = query.is('archived_at', null);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toSchool);
}

export async function insertSchool(fields) {
  const row = {
    name: fields.name,
    slug: fields.slug,
  };
  if (fields.plan !== undefined) row.plan = fields.plan;
  if (fields.ownerUserId !== undefined) row.owner_user_id = fields.ownerUserId;
  if (fields.usageCapUsd !== undefined) row.usage_cap_usd = fields.usageCapUsd;
  if (fields.memberLimit !== undefined) row.member_limit = fields.memberLimit;
  if (fields.monthlyRoleplayMinutes !== undefined) row.monthly_roleplay_minutes = fields.monthlyRoleplayMinutes;
  if (fields.usagePeriodStart !== undefined) row.usage_period_start = fields.usagePeriodStart;
  if (fields.usagePeriodEnd !== undefined) row.usage_period_end = fields.usagePeriodEnd;
  const { data, error } = await supabase
    .from('schools')
    .insert(row)
    .select(SCHOOL_COLS)
    .single();
  if (error) throw error;
  return toSchool(data);
}

export async function updateSchool(id, fields) {
  const row = {};
  if (fields.name !== undefined) row.name = fields.name;
  if (fields.slug !== undefined) row.slug = fields.slug;
  if (fields.plan !== undefined) row.plan = fields.plan;
  if (fields.streetAddress !== undefined) row.street_address = fields.streetAddress;
  if (fields.city !== undefined) row.city = fields.city;
  if (fields.state !== undefined) row.state = fields.state;
  if (fields.zipCode !== undefined) row.zip_code = fields.zipCode;
  if (fields.introOffer !== undefined) row.intro_offer = fields.introOffer;
  if (fields.priceRangeLow !== undefined) row.price_range_low = fields.priceRangeLow;
  if (fields.priceRangeHigh !== undefined) row.price_range_high = fields.priceRangeHigh;
  if (fields.programDirectorName !== undefined) row.program_director_name = fields.programDirectorName;
  if (fields.additionalNotes !== undefined) row.additional_notes = fields.additionalNotes;
  if (fields.ownerUserId !== undefined) row.owner_user_id = fields.ownerUserId;
  if (fields.usageCapUsd !== undefined) row.usage_cap_usd = fields.usageCapUsd;
  if (fields.memberLimit !== undefined) row.member_limit = fields.memberLimit;
  if (fields.monthlyRoleplayMinutes !== undefined) row.monthly_roleplay_minutes = fields.monthlyRoleplayMinutes;
  if (fields.usagePeriodStart !== undefined) row.usage_period_start = fields.usagePeriodStart;
  if (fields.usagePeriodEnd !== undefined) row.usage_period_end = fields.usagePeriodEnd;
  if (fields.archivedAt !== undefined) row.archived_at = fields.archivedAt;
  if (fields.subscriptionStatus !== undefined) row.subscription_status = fields.subscriptionStatus;
  if (fields.subscriptionCurrentPeriodEnd !== undefined) row.subscription_current_period_end = fields.subscriptionCurrentPeriodEnd;
  if (fields.accessGraceUntil !== undefined) row.access_grace_until = fields.accessGraceUntil;
  const { error } = await supabase.from('schools').update(row).eq('id', id);
  if (error) throw error;
}

export async function archiveSchool(id) {
  await updateSchool(id, { archivedAt: new Date().toISOString() });
}

export async function restoreSchool(id) {
  await updateSchool(id, { archivedAt: null });
}

export async function getSchoolUsageTotals(schoolId) {
  const { data, error } = await supabase
    .from('calls')
    .select('cost_usd')
    .eq('school_id', schoolId)
    .not('cost_usd', 'is', null)
    .limit(10000);
  if (error) throw error;
  const total = (data || []).reduce((sum, r) => sum + Number(r.cost_usd || 0), 0);
  return { totalUsd: Math.round(total * 10000) / 10000 };
}
