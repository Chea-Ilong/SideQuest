import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';

const SOURCE_RELIABILITY: Record<string, number> = {
  dependency: 1.0,
  repo_language: 0.8,
  repo_topic: 0.7,
  resume_bullet: 0.6,
  manual_claim: 0.5,
  readme_snippet: 0.4,
};

function recencyWeight(timestampStr: string | null | undefined): number {
  if (!timestampStr) return 0.7; // unknown recency → moderate weight
  const daysSince = (Date.now() - new Date(timestampStr).getTime()) / (1000 * 60 * 60 * 24);
  return 1 / (1 + daysSince / 365); // half-life ~1 year
}

/**
 * Saturation accumulation: score = 1 - product(1 - item_weight_i)
 * Ensures multiple weak evidences accumulate, but strongly saturate near 1.
 */
function saturatingScore(weights: number[]): number {
  if (weights.length === 0) return 0;
  const product = weights.reduce((acc, w) => acc * (1 - w), 1);
  return Math.round((1 - product) * 1000) / 1000;
}

export async function computeSkillScores(scanId: string): Promise<number> {
  logger.info({ scanId }, 'Computing skill scores');

  // Step 1: Get all evidence items for this scan
  const { data: evidenceItems, error: evError } = await supabase
    .schema('app')
    .from('evidence_items')
    .select('id, evidence_type, strength, timestamp')
    .eq('scan_id', scanId);

  if (evError || !evidenceItems || evidenceItems.length === 0) {
    logger.warn({ evError, scanId }, 'No evidence items found for scan');
    return 0;
  }

  const evidenceIds = evidenceItems.map((e) => e.id);
  const evidenceMap = new Map(evidenceItems.map((e) => [e.id, e]));

  // Step 2: Get all skill mentions for those evidence items
  const { data: mentions, error: mentionError } = await supabase
    .schema('app')
    .from('skill_mentions')
    .select('id, evidence_id')
    .in('evidence_id', evidenceIds);

  if (mentionError || !mentions || mentions.length === 0) {
    logger.warn({ mentionError, scanId }, 'No skill mentions found for scan');
    return 0;
  }

  const mentionIds = mentions.map((m) => m.id);
  const mentionToEvidence = new Map(mentions.map((m) => [m.id, m.evidence_id]));

  // Step 3: Get all primary normalizations for those mentions
  const { data: normalizations, error: normError } = await supabase
    .schema('app')
    .from('skill_normalizations')
    .select('esco_uri, score, mention_id')
    .in('mention_id', mentionIds)
    .eq('is_primary', true);

  if (normError || !normalizations) {
    logger.error({ normError, scanId }, 'Failed to fetch normalizations');
    return 0;
  }

  // Step 4: Group by esco_uri and compute scores
  const skillMap = new Map<
    string,
    Array<{ weight: number; evidenceId: string; timestamp: string | null }>
  >();

  for (const norm of normalizations) {
    const evidenceId = mentionToEvidence.get(norm.mention_id);
    if (!evidenceId) continue;

    const evidence = evidenceMap.get(evidenceId);
    if (!evidence) continue;

    const reliability = SOURCE_RELIABILITY[evidence.evidence_type] ?? 0.4;
    const recency = recencyWeight(evidence.timestamp);
    const weight = evidence.strength * reliability * recency;

    if (!skillMap.has(norm.esco_uri)) {
      skillMap.set(norm.esco_uri, []);
    }
    skillMap.get(norm.esco_uri)!.push({
      weight,
      evidenceId,
      timestamp: evidence.timestamp,
    });
  }

  // Step 5: Compute scores and upsert
  const scores = [];
  for (const [esco_uri, items] of skillMap.entries()) {
    items.sort((a, b) => b.weight - a.weight);
    const topItems = items.slice(0, 20);
    const score = saturatingScore(topItems.map((i) => i.weight));

    // Recency: days since most recent evidence
    const mostRecent = items
      .map((i) => i.timestamp)
      .filter(Boolean)
      .sort()
      .at(-1);
    const recencyDays = mostRecent
      ? Math.round((Date.now() - new Date(mostRecent).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    scores.push({
      scan_id: scanId,
      esco_uri,
      score,
      recency_days: recencyDays,
      evidence_count: items.length,
      top_evidence_ids: topItems.slice(0, 5).map((i) => i.evidenceId),
    });
  }

  // Upsert scores
  if (scores.length > 0) {
    const { error: upsertError } = await supabase
      .schema('app')
      .from('user_skill_scores')
      .upsert(scores, { onConflict: 'scan_id,esco_uri' });
    if (upsertError) logger.error({ upsertError, scanId }, 'Failed to upsert skill scores');
  }

  logger.info({ scanId, skillCount: scores.length }, 'Skill scoring complete');
  return scores.length;
}
