// db/supabase.js
// Single Supabase client instance used across the entire backend.
// Uses the SERVICE ROLE key — has full DB access, bypasses RLS.
// Never expose this key to the frontend.
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    // Service role key does not need session persistence
    autoRefreshToken: false,
    persistSession:   false,
  },
});
