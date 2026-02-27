-- Evidence items: immutable facts derived from sources
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
  ref JSONB DEFAULT '{}',             -- {repo, path, line, section, etc.}
  text_snippet TEXT,                  -- raw text for display
  timestamp TIMESTAMPTZ,              -- when this evidence was produced (commit date, job start, etc.)
  strength NUMERIC(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill mentions found within evidence items
CREATE TABLE app.skill_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES app.evidence_items(id) ON DELETE CASCADE,
  mention_text TEXT NOT NULL,         -- raw text of the mention (e.g. "react", "React.js")
  context_text TEXT,                  -- surrounding context for disambiguation
  start_idx INT,                      -- character offset in text_snippet
  end_idx INT,
  confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1)
);
