-- ESCO reference tables (language-independent taxonomy)
CREATE SCHEMA IF NOT EXISTS ref;

CREATE TABLE ref.esco_skills (
  esco_uri TEXT PRIMARY KEY,
  preferred_label TEXT NOT NULL,
  alt_labels TEXT,
  skill_type TEXT,                   -- 'skill/competence' or 'knowledge'
  reuse_level TEXT,                  -- 'cross-sectoral', 'sector-specific', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ref.esco_skill_aliases (
  id BIGSERIAL PRIMARY KEY,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  lang TEXT DEFAULT 'en'
);

-- Parent-child skill hierarchy
CREATE TABLE ref.esco_hierarchy (
  parent_uri TEXT NOT NULL,
  child_uri TEXT NOT NULL,
  PRIMARY KEY (parent_uri, child_uri)
);

-- Associative skill-skill relations
CREATE TABLE ref.esco_skill_relations (
  skill_uri_a TEXT NOT NULL,
  skill_uri_b TEXT NOT NULL,
  relation_type TEXT DEFAULT 'associated',
  PRIMARY KEY (skill_uri_a, skill_uri_b)
);

-- Metadata for reproducibility
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

-- Target role templates for gap analysis
CREATE TABLE ref.target_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  skills JSONB NOT NULL DEFAULT '[]'  -- [{esco_uri, preferred_label, weight}]
);
