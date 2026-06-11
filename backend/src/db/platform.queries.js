import { supabase } from './supabase.js';

function toSettings(row) {
  if (!row) return null;
  return {
    id: row.id,
    defaultLlmModel: row.default_llm_model,
    markupPercent: row.markup_percent != null ? Number(row.markup_percent) : null,
    defaultUsageCapUsd: row.default_usage_cap_usd != null ? Number(row.default_usage_cap_usd) : null,
    maintenanceEnabled: Boolean(row.maintenance_enabled),
    maintenanceMessage: row.maintenance_message ?? null,
    maintenanceSeverity: row.maintenance_severity ?? 'info',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findPlatformSettings() {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('id, default_llm_model, markup_percent, default_usage_cap_usd, maintenance_enabled, maintenance_message, maintenance_severity, created_at, updated_at')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return toSettings(data);
}

export async function updatePlatformSettings(id, fields) {
  const row = {};
  if (fields.defaultLlmModel !== undefined) row.default_llm_model = fields.defaultLlmModel;
  if (fields.markupPercent !== undefined) row.markup_percent = fields.markupPercent;
  if (fields.defaultUsageCapUsd !== undefined) row.default_usage_cap_usd = fields.defaultUsageCapUsd;
  if (fields.maintenanceEnabled !== undefined) row.maintenance_enabled = fields.maintenanceEnabled;
  if (fields.maintenanceMessage !== undefined) row.maintenance_message = fields.maintenanceMessage;
  if (fields.maintenanceSeverity !== undefined) row.maintenance_severity = fields.maintenanceSeverity;
  const { error } = await supabase.from('platform_settings').update(row).eq('id', id);
  if (error) throw error;
}
