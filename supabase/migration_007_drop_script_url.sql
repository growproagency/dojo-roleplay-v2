-- Migration 007: Drop script_url from custom scenarios
-- The external-URL approach was replaced with in-app training scripts derived
-- from the existing scoring rubrics in server/scoring.js. Idempotent.

ALTER TABLE custom_scenarios DROP COLUMN IF EXISTS script_url;
