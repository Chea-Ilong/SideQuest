-- ============================================================
-- ESCO reference indexes (for fast normalization lookups)
-- ============================================================

-- GIN trigram index for fuzzy preferred label search
CREATE INDEX idx_esco_skills_label_gin ON ref.esco_skills
  USING GIN (preferred_label gin_trgm_ops);

-- Case-insensitive exact match on preferred label
CREATE INDEX idx_esco_skills_label_lower ON ref.esco_skills
  (lower(preferred_label));

-- GIN trigram index on aliases for fuzzy mention matching
CREATE INDEX idx_esco_aliases_alias_gin ON ref.esco_skill_aliases
  USING GIN (alias gin_trgm_ops);

-- Case-insensitive exact alias match
CREATE INDEX idx_esco_aliases_alias_lower ON ref.esco_skill_aliases
  (lower(alias));

-- Lookup aliases by ESCO URI
CREATE INDEX idx_esco_aliases_uri ON ref.esco_skill_aliases (esco_uri);

-- ============================================================
-- Scan table indexes
-- ============================================================

-- Share token lookup (used on every authenticated request)
CREATE UNIQUE INDEX idx_scans_share_token ON app.scans (share_token);

-- Source lookups by scan
CREATE INDEX idx_sources_scan ON app.sources (scan_id);

-- Artifact lookups by scan
CREATE INDEX idx_artifacts_scan ON app.artifacts (scan_id);

-- ============================================================
-- Evidence table indexes
-- ============================================================

CREATE INDEX idx_evidence_scan ON app.evidence_items (scan_id);
CREATE INDEX idx_evidence_source ON app.evidence_items (source_id);
CREATE INDEX idx_evidence_type ON app.evidence_items (evidence_type);
CREATE INDEX idx_mentions_evidence ON app.skill_mentions (evidence_id);

-- ============================================================
-- Normalization indexes
-- ============================================================

CREATE INDEX idx_normalizations_mention ON app.skill_normalizations (mention_id);
CREATE INDEX idx_normalizations_esco ON app.skill_normalizations (esco_uri);
-- Fast lookup of primary normalization for a mention
CREATE INDEX idx_normalizations_primary ON app.skill_normalizations (mention_id)
  WHERE is_primary = true;

-- ============================================================
-- Computed output indexes
-- ============================================================

CREATE INDEX idx_scores_scan ON app.user_skill_scores (scan_id);
CREATE INDEX idx_scores_scan_uri ON app.user_skill_scores (scan_id, esco_uri);
CREATE INDEX idx_clusters_scan ON app.clusters (scan_id);
CREATE INDEX idx_cluster_memberships_cluster ON app.cluster_memberships (cluster_id);
CREATE INDEX idx_gaps_scan ON app.gaps (scan_id);
CREATE INDEX idx_gaps_scan_score ON app.gaps (scan_id, gap_score DESC);
CREATE INDEX idx_timeline_scan ON app.timeline_points (scan_id, period_start);
CREATE INDEX idx_roadmap_scan ON app.roadmap_items (scan_id, priority);
