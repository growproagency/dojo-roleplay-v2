-- Migration 008: Detach platform administrators from any specific school.
-- Global admins shouldn't belong to a tenant; they pick a "viewing school"
-- via the UI (school switcher) when they need school-scoped access.
-- Historical rows in calls and phone_call_attempts keep their school_id
-- snapshot, so past activity still shows when the global admin "enters"
-- that school via the switcher.

UPDATE users
SET school_id = NULL
WHERE role IN ('global_admin', 'admin');
