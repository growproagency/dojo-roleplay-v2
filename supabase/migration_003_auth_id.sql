-- Migration 003: Add supabase_auth_id to users table
-- Stores the Supabase Auth UUID so we can directly delete auth accounts
-- without scanning all auth users.

-- Add column (nullable — existing users will get backfilled on next login)
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_auth_id UUID;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id ON users(supabase_auth_id);
