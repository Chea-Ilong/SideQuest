-- Application schema
CREATE SCHEMA IF NOT EXISTS app;

-- Core scan entity: each analysis run is an isolated scan
CREATE TABLE app.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','running','ready','error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  config JSONB DEFAULT '{}',          -- {targetRole, weights, options}
  progress JSONB DEFAULT '{}',        -- {phase, percent, steps_completed, errors}
  error_details JSONB,
  delete_at TIMESTAMPTZ               -- optional TTL
);

-- Data sources attached to a scan
CREATE TABLE app.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('github','resume','manual')),
  config JSONB DEFAULT '{}',          -- GitHub: {username, useToken}; Resume: {filename, mimeType}; Manual: {}
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stored files/snapshots from sources
CREATE TABLE app.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  source_id UUID REFERENCES app.sources(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('resume_upload','github_snapshot','manual_data')),
  storage_path TEXT,                  -- Supabase Storage object path
  metadata JSONB DEFAULT '{}',        -- extracted_text, file size, parse stats, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
