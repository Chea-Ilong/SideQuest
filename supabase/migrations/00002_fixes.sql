-- ============================================================
-- Migration 00002: Critical bug fixes
-- ============================================================

-- Fix #1: Add UNIQUE constraint to skill_normalizations(mention_id, esco_uri)
-- This is required for the upsert in normalizationService.ts to work correctly.
-- Without it, upserts create duplicates instead of updating existing rows.
ALTER TABLE app.skill_normalizations
  ADD CONSTRAINT skill_normalizations_mention_esco_unique
  UNIQUE (mention_id, esco_uri);

-- Fix #2: Ensure app and ref schemas are accessible via PostgREST
-- (These grants ensure the service_role can access both schemas)
GRANT USAGE ON SCHEMA app TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA ref TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA app TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA ref TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA ref TO anon, authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ref TO service_role;

-- Ensure future tables also get these grants
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA ref
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ref
  GRANT SELECT ON TABLES TO anon, authenticated;
