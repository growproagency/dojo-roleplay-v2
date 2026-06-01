// lib/supabase.js
// Supabase client for the frontend.
// Uses the ANON key — safe to expose. RLS rules protect your data.
// Never use the service role key in the frontend.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env.local and fill in your values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
