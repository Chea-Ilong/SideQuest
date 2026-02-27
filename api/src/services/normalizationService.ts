import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';

interface NormalizationCandidate {
  esco_uri: string;
  score: number;
  method: 'exact' | 'trigram';
}

/**
 * Normalize all skill mentions for a scan to ESCO URIs.
 * Stage 1: exact match on aliases (lowercased)
 * Stage 2: trigram similarity if no exact match
 * Stage 3: context boost re-ranking
 */
export async function normalizeSkillMentions(scanId: string): Promise<number> {
  logger.info({ scanId }, 'Starting skill normalization');

  // Fetch all mentions for this scan (via evidence_items join)
  const { data: mentions, error } = await supabase
    .schema('app')
    .from('skill_mentions')
    .select(`
      id,
      mention_text,
      context_text,
      evidence_id,
      evidence_items!inner(scan_id)
    `)
    .eq('evidence_items.scan_id', scanId);

  if (error || !mentions) {
    logger.error({ error, scanId }, 'Failed to fetch skill mentions');
    return 0;
  }

  logger.info({ scanId, mentionCount: mentions.length }, 'Mentions to normalize');

  let normalized = 0;
  const batchSize = 50; // process in batches to avoid overloading DB

  for (let i = 0; i < mentions.length; i += batchSize) {
    const batch = mentions.slice(i, i + batchSize);
    await Promise.all(
      batch.map((mention) => normalizeMention(mention.id, mention.mention_text, mention.context_text ?? ''))
    );
    normalized += batch.length;
  }

  logger.info({ scanId, normalized }, 'Normalization complete');
  return normalized;
}

async function normalizeMention(
  mentionId: string,
  mentionText: string,
  contextText: string
): Promise<void> {
  const text = mentionText.trim();
  if (text.length < 2) return;

  const candidates: NormalizationCandidate[] = [];

  // Stage 1: Exact match (case-insensitive)
  const { data: exactMatches } = await supabase
    .schema('ref')
    .from('esco_skill_aliases')
    .select('esco_uri')
    .eq('alias', text.toLowerCase())
    .limit(3);

  // Also try the preferred label directly
  const { data: labelExact } = await supabase
    .schema('ref')
    .from('esco_skills')
    .select('esco_uri')
    .ilike('preferred_label', text)
    .limit(3);

  const exactUris = new Set([
    ...(exactMatches ?? []).map((m) => m.esco_uri),
    ...(labelExact ?? []).map((s) => s.esco_uri),
  ]);

  for (const uri of exactUris) {
    candidates.push({ esco_uri: uri, score: 1.0, method: 'exact' });
  }

  // Stage 2: Trigram similarity (only if no exact match)
  if (candidates.length === 0 && text.length >= 3) {
    const { data: fuzzyMatches } = await supabase.rpc('search_skills_trigram', {
      query_text: text,
      result_limit: 5,
    });

    if (fuzzyMatches && fuzzyMatches.length > 0) {
      for (const match of fuzzyMatches) {
        if (match.similarity >= 0.3) {
          candidates.push({
            esco_uri: match.esco_uri,
            score: match.similarity,
            method: 'trigram',
          });
        }
      }
    }
  }

  if (candidates.length === 0) return;

  // Stage 3: Context boost — simple keyword overlap
  const contextLower = contextText.toLowerCase();
  const boostedCandidates = candidates.map((c) => {
    let boost = 0;
    // Check if context reinforces the candidate URI (heuristic: domain keywords)
    if (contextLower.includes('machine learning') || contextLower.includes('ml') || contextLower.includes('ai')) {
      if (c.esco_uri.includes('skill')) boost += 0.05;
    }
    return { ...c, score: Math.min(1, c.score + boost) };
  });

  // Sort by score descending
  boostedCandidates.sort((a, b) => b.score - a.score);

  // Insert normalizations (top 3 candidates)
  const topCandidates = boostedCandidates.slice(0, 3);
  const normalizations = topCandidates.map((c, idx) => ({
    mention_id: mentionId,
    esco_uri: c.esco_uri,
    method: c.method,
    score: Math.round(c.score * 1000) / 1000,
    is_primary: idx === 0,
  }));

  await supabase
    .schema('app')
    .from('skill_normalizations')
    .upsert(normalizations, { onConflict: 'mention_id,esco_uri' });
}
