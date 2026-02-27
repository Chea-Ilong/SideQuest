-- Computed skill scores (aggregated evidence per skill per scan)
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

-- Skill clusters (grouped by co-occurrence + KMeans)
CREATE TABLE app.clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  centroid_x NUMERIC,
  centroid_y NUMERIC,
  color TEXT DEFAULT '#6366f1'
);

-- Cluster membership with 2D coordinates for visualization
CREATE TABLE app.cluster_memberships (
  cluster_id UUID NOT NULL REFERENCES app.clusters(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL,
  score NUMERIC(4,3) DEFAULT 0,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (cluster_id, esco_uri)
);

-- Skill gaps vs target role
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

-- Career timeline (descriptive, not predictive)
CREATE TABLE app.timeline_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  top_skills JSONB DEFAULT '[]',       -- [{esco_uri, preferred_label, score}]
  cluster_summary JSONB DEFAULT '{}'   -- {cluster_label: skill_count}
);

-- Learning roadmap items
CREATE TABLE app.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  priority INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_hours INT,
  prerequisite_uris TEXT[] DEFAULT '{}',
  resources JSONB DEFAULT '[]'         -- [{title, url, type}]
);

-- Deletion audit log
CREATE TABLE app.deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  storage_paths_deleted TEXT[] DEFAULT '{}',
  details JSONB DEFAULT '{}'
);
