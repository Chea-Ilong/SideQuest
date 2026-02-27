-- ============================================================
-- 1. Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. ESCO Reference Tables
-- ============================================================

CREATE SCHEMA IF NOT EXISTS ref;

CREATE TABLE ref.esco_skills (
  esco_uri TEXT PRIMARY KEY,
  preferred_label TEXT NOT NULL,
  alt_labels TEXT,
  skill_type TEXT,
  reuse_level TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ref.esco_skill_aliases (
  id BIGSERIAL PRIMARY KEY,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  lang TEXT DEFAULT 'en'
);

CREATE TABLE ref.esco_hierarchy (
  parent_uri TEXT NOT NULL,
  child_uri TEXT NOT NULL,
  PRIMARY KEY (parent_uri, child_uri)
);

CREATE TABLE ref.esco_skill_relations (
  skill_uri_a TEXT NOT NULL,
  skill_uri_b TEXT NOT NULL,
  relation_type TEXT DEFAULT 'associated',
  PRIMARY KEY (skill_uri_a, skill_uri_b)
);

CREATE TABLE ref.esco_metadata (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  skill_count INT,
  alias_count INT,
  hierarchy_count INT,
  relation_count INT,
  file_checksums JSONB DEFAULT '{}'
);

CREATE TABLE ref.target_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  skills JSONB NOT NULL DEFAULT '[]'
);

-- ============================================================
-- 3. Application Schema – Scan Tables
-- ============================================================

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','running','ready','error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  config JSONB DEFAULT '{}',
  progress JSONB DEFAULT '{}',
  error_details JSONB,
  delete_at TIMESTAMPTZ
);

CREATE TABLE app.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('github','resume','manual')),
  config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  source_id UUID REFERENCES app.sources(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('resume_upload','github_snapshot','manual_data')),
  storage_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Evidence Tables
-- ============================================================

CREATE TABLE app.evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES app.sources(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'repo_topic',
    'repo_language',
    'dependency',
    'readme_snippet',
    'resume_bullet',
    'manual_claim'
  )),
  ref JSONB DEFAULT '{}',
  text_snippet TEXT,
  timestamp TIMESTAMPTZ,
  strength NUMERIC(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.skill_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES app.evidence_items(id) ON DELETE CASCADE,
  mention_text TEXT NOT NULL,
  context_text TEXT,
  start_idx INT,
  end_idx INT,
  confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1)
);

-- ============================================================
-- 5. Normalization Tables
-- ============================================================

CREATE TABLE app.skill_normalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mention_id UUID NOT NULL REFERENCES app.skill_mentions(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  method TEXT NOT NULL CHECK (method IN ('exact','trigram','embedding','manual_override')),
  score NUMERIC(4,3) DEFAULT 0 CHECK (score >= 0 AND score <= 1),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Computed / Output Tables
-- ============================================================

CREATE TABLE app.user_skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  score NUMERIC(4,3) DEFAULT 0 CHECK (score >= 0 AND score <= 1),
  recency_days INT,
  evidence_count INT DEFAULT 0,
  top_evidence_ids UUID[] DEFAULT '{}',
  UNIQUE (scan_id, esco_uri)
);

CREATE TABLE app.clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  centroid_x NUMERIC,
  centroid_y NUMERIC,
  color TEXT DEFAULT '#6366f1'
);

CREATE TABLE app.cluster_memberships (
  cluster_id UUID NOT NULL REFERENCES app.clusters(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL,
  score NUMERIC(4,3) DEFAULT 0,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (cluster_id, esco_uri)
);

CREATE TABLE app.gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  target_role_id TEXT REFERENCES ref.target_roles(id),
  target_weight NUMERIC(3,2) DEFAULT 0,
  user_score NUMERIC(3,2) DEFAULT 0,
  gap_score NUMERIC(4,3) DEFAULT 0,
  rationale TEXT
);

CREATE TABLE app.timeline_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  top_skills JSONB DEFAULT '[]',
  cluster_summary JSONB DEFAULT '{}'
);

CREATE TABLE app.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  priority INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_hours INT,
  prerequisite_uris TEXT[] DEFAULT '{}',
  resources JSONB DEFAULT '[]'
);

CREATE TABLE app.deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  storage_paths_deleted TEXT[] DEFAULT '{}',
  details JSONB DEFAULT '{}'
);

-- ============================================================
-- 7. Indexes
-- ============================================================

-- ESCO reference indexes
CREATE INDEX idx_esco_skills_label_gin ON ref.esco_skills
  USING GIN (preferred_label gin_trgm_ops);
CREATE INDEX idx_esco_skills_label_lower ON ref.esco_skills
  (lower(preferred_label));
CREATE INDEX idx_esco_aliases_alias_gin ON ref.esco_skill_aliases
  USING GIN (alias gin_trgm_ops);
CREATE INDEX idx_esco_aliases_alias_lower ON ref.esco_skill_aliases
  (lower(alias));
CREATE INDEX idx_esco_aliases_uri ON ref.esco_skill_aliases (esco_uri);

-- Scan indexes
CREATE UNIQUE INDEX idx_scans_share_token ON app.scans (share_token);
CREATE INDEX idx_sources_scan ON app.sources (scan_id);
CREATE INDEX idx_artifacts_scan ON app.artifacts (scan_id);

-- Evidence indexes
CREATE INDEX idx_evidence_scan ON app.evidence_items (scan_id);
CREATE INDEX idx_evidence_source ON app.evidence_items (source_id);
CREATE INDEX idx_evidence_type ON app.evidence_items (evidence_type);
CREATE INDEX idx_mentions_evidence ON app.skill_mentions (evidence_id);

-- Normalization indexes
CREATE INDEX idx_normalizations_mention ON app.skill_normalizations (mention_id);
CREATE INDEX idx_normalizations_esco ON app.skill_normalizations (esco_uri);
CREATE INDEX idx_normalizations_primary ON app.skill_normalizations (mention_id)
  WHERE is_primary = true;

-- Computed output indexes
CREATE INDEX idx_scores_scan ON app.user_skill_scores (scan_id);
CREATE INDEX idx_scores_scan_uri ON app.user_skill_scores (scan_id, esco_uri);
CREATE INDEX idx_clusters_scan ON app.clusters (scan_id);
CREATE INDEX idx_cluster_memberships_cluster ON app.cluster_memberships (cluster_id);
CREATE INDEX idx_gaps_scan ON app.gaps (scan_id);
CREATE INDEX idx_gaps_scan_score ON app.gaps (scan_id, gap_score DESC);
CREATE INDEX idx_timeline_scan ON app.timeline_points (scan_id, period_start);
CREATE INDEX idx_roadmap_scan ON app.roadmap_items (scan_id, priority);

-- ============================================================
-- 8. Permissions
-- ============================================================

GRANT USAGE ON SCHEMA app TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA ref TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA app TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA ref TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA ref TO anon, authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ref TO service_role;

-- ============================================================
-- 9. RPC Functions
-- ============================================================

CREATE OR REPLACE FUNCTION search_skills_trigram(
  query_text TEXT,
  result_limit INT DEFAULT 5
)
RETURNS TABLE (
  esco_uri TEXT,
  preferred_label TEXT,
  similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    a.esco_uri,
    s.preferred_label,
    similarity(a.alias, query_text)::FLOAT AS similarity
  FROM ref.esco_skill_aliases a
  JOIN ref.esco_skills s ON s.esco_uri = a.esco_uri
  WHERE a.alias % query_text
  ORDER BY a.alias <-> query_text
  LIMIT result_limit;
$$;
