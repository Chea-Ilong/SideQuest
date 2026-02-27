-- Normalization: maps skill mentions to ESCO URIs
-- Multiple candidates allowed; is_primary=true marks the best match
CREATE TABLE app.skill_normalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mention_id UUID NOT NULL REFERENCES app.skill_mentions(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  method TEXT NOT NULL CHECK (method IN ('exact','trigram','embedding','manual_override')),
  score NUMERIC(4,3) DEFAULT 0 CHECK (score >= 0 AND score <= 1),
  is_primary BOOLEAN DEFAULT false,   -- the chosen normalization for this mention
  created_at TIMESTAMPTZ DEFAULT NOW()
);
