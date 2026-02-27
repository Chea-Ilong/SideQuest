-- Trigram similarity search for skill normalization
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
