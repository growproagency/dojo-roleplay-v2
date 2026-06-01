-- Migration 013: Allow calls.school_id to be NULL.
-- Global admins are no longer attached to a school (migration 008), but they
-- still need to be able to make test calls (web + phone). Those calls have no
-- owning school — they don't count toward any school's usage cap and don't
-- show up in school-scoped views. Migration 002 conditionally set school_id
-- to NOT NULL if every row had a value at the time, so we drop that
-- constraint here. Safe to re-run.

ALTER TABLE calls ALTER COLUMN school_id DROP NOT NULL;
