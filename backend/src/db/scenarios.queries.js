import { supabase } from './supabase.js';

const COLS = 'id, slug, title, description, context_type, character_name, character_blurb, topics, school_id, character_prompt, opening_line, voice_id, voice_provider, scoring_prompt, is_active, created_by, created_at, updated_at';

function toScenario(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    contextType: row.context_type,
    characterName: row.character_name,
    characterBlurb: row.character_blurb ?? null,
    topics: row.topics ?? null,
    schoolId: row.school_id ?? null,
    characterPrompt: row.character_prompt,
    openingLine: row.opening_line,
    voiceId: row.voice_id,
    voiceProvider: row.voice_provider,
    scoringPrompt: row.scoring_prompt,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findCustomScenarios(schoolId) {
  let query = supabase.from('custom_scenarios').select(COLS).eq('is_active', true);
  if (schoolId != null) {
    query = query.or(`school_id.eq.${schoolId},school_id.is.null`);
  } else {
    query = query.is('school_id', null);
  }
  const { data, error } = await query.order('created_at', { ascending: true }).limit(100);
  if (error) throw error;
  return (data || []).map(toScenario);
}

export async function findAllCustomScenarios() {
  const { data, error } = await supabase
    .from('custom_scenarios')
    .select(COLS)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data || []).map(toScenario);
}

export async function findManagedCustomScenarios(schoolId, isGlobalAdmin = false) {
  let query = supabase.from('custom_scenarios').select(COLS);
  if (!isGlobalAdmin) {
    query = query.eq('school_id', schoolId);
  }
  const { data, error } = await query.order('created_at', { ascending: true }).limit(100);
  if (error) throw error;
  return (data || []).map(toScenario);
}

export async function findCustomScenarioById(id) {
  const { data, error } = await supabase
    .from('custom_scenarios')
    .select(COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return toScenario(data);
}

export async function findCustomScenarioBySlug(slug, schoolId = null) {
  let query = supabase
    .from('custom_scenarios')
    .select(COLS)
    .eq('slug', slug)
    .eq('is_active', true);

  if (schoolId != null) {
    query = query.or(`school_id.eq.${schoolId},school_id.is.null`);
  } else {
    query = query.is('school_id', null);
  }

  const { data, error } = await query
    .order('school_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return toScenario(data);
}

export async function insertCustomScenario(fields) {
  const { data, error } = await supabase
    .from('custom_scenarios')
    .insert({
      slug: fields.slug,
      title: fields.title,
      description: fields.description,
      context_type: fields.contextType ?? 'inbound_call',
      character_name: fields.characterName,
      character_blurb: fields.characterBlurb ?? null,
      topics: fields.topics ?? null,
      school_id: fields.schoolId ?? null,
      character_prompt: fields.characterPrompt,
      opening_line: fields.openingLine,
      voice_id: fields.voiceId,
      voice_provider: fields.voiceProvider ?? 'vapi',
      scoring_prompt: fields.scoringPrompt,
      is_active: fields.isActive ?? true,
      created_by: fields.createdBy,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return toScenario(data);
}

export async function updateCustomScenario(id, fields) {
  const row = {};
  if (fields.title !== undefined) row.title = fields.title;
  if (fields.description !== undefined) row.description = fields.description;
  if (fields.contextType !== undefined) row.context_type = fields.contextType;
  if (fields.characterName !== undefined) row.character_name = fields.characterName;
  if (fields.characterBlurb !== undefined) row.character_blurb = fields.characterBlurb;
  if (fields.topics !== undefined) row.topics = fields.topics;
  if (fields.characterPrompt !== undefined) row.character_prompt = fields.characterPrompt;
  if (fields.openingLine !== undefined) row.opening_line = fields.openingLine;
  if (fields.voiceId !== undefined) row.voice_id = fields.voiceId;
  if (fields.voiceProvider !== undefined) row.voice_provider = fields.voiceProvider;
  if (fields.scoringPrompt !== undefined) row.scoring_prompt = fields.scoringPrompt;
  if (fields.isActive !== undefined) row.is_active = fields.isActive;
  if (fields.schoolId !== undefined) row.school_id = fields.schoolId;
  const { error } = await supabase.from('custom_scenarios').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteCustomScenario(id) {
  const { error } = await supabase.from('custom_scenarios').delete().eq('id', id);
  if (error) throw error;
}
