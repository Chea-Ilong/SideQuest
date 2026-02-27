import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';

export async function computeTimeline(scanId: string): Promise<number> {
  logger.info({ scanId }, 'Computing career timeline');

  // Fetch evidence items with timestamps
  const { data: evidenceItems, error } = await supabase
    .schema('app')
    .from('evidence_items')
    .select(`
      id,
      evidence_type,
      strength,
      timestamp,
      skill_mentions(
        skill_normalizations!inner(
          esco_uri,
          is_primary
        )
      )
    `)
    .eq('scan_id', scanId)
    .not('timestamp', 'is', null);

  if (error) {
    logger.error({ error, scanId }, 'Failed to fetch evidence for timeline');
    return 0;
  }

  if (!evidenceItems || evidenceItems.length === 0) {
    logger.info({ scanId }, 'No timestamped evidence for timeline');
    return 0;
  }

  // Find date range
  const timestamps = evidenceItems
    .map((e) => new Date(e.timestamp!).getTime())
    .filter((t): t is number => !isNaN(t) && t > 0);

  if (timestamps.length === 0) return 0;

  const minDate = new Date(Math.min(...timestamps));
  const maxDate = new Date(Math.max(...timestamps));

  // Generate quarterly buckets
  const buckets: Array<{ start: Date; end: Date }> = [];
  const current = new Date(minDate);
  current.setDate(1);
  current.setMonth(Math.floor(current.getMonth() / 3) * 3);

  while (current <= maxDate) {
    const start = new Date(current);
    const end = new Date(current);
    end.setMonth(end.getMonth() + 3);
    end.setDate(0); // last day of quarter
    buckets.push({ start, end });
    current.setMonth(current.getMonth() + 3);
  }

  if (buckets.length === 0) return 0;

  // For each bucket, compute skill scores from evidence in that period
  const timelinePoints = [];
  const escoUrisInScan = new Set<string>();

  for (const bucket of buckets) {
    const bucketEvidence = evidenceItems.filter((e) => {
      const t = new Date(e.timestamp!).getTime();
      return t >= bucket.start.getTime() && t <= bucket.end.getTime();
    });

    if (bucketEvidence.length === 0) continue;

    // Collect skills from this bucket's evidence
    const bucketSkillScores = new Map<string, number>();
    for (const evidence of bucketEvidence) {
      const mentions = (evidence as any).skill_mentions ?? [];
      for (const mention of mentions) {
        const normalizations = mention.skill_normalizations ?? [];
        for (const norm of normalizations) {
          if (!norm.is_primary) continue;
          const existing = bucketSkillScores.get(norm.esco_uri) ?? 0;
          bucketSkillScores.set(norm.esco_uri, Math.min(1, existing + evidence.strength * 0.3));
          escoUrisInScan.add(norm.esco_uri);
        }
      }
    }

    if (bucketSkillScores.size === 0) continue;

    // Top 5 skills for this period
    const topSkills = [...bucketSkillScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([esco_uri, score]) => ({ esco_uri, preferred_label: esco_uri, score }));

    timelinePoints.push({
      scan_id: scanId,
      period_start: bucket.start.toISOString().split('T')[0],
      period_end: bucket.end.toISOString().split('T')[0],
      top_skills: topSkills,
      cluster_summary: {},
    });
  }

  // Enrich with ESCO labels
  if (escoUrisInScan.size > 0) {
    const { data: escoSkills } = await supabase
      .schema('ref')
      .from('esco_skills')
      .select('esco_uri, preferred_label')
      .in('esco_uri', [...escoUrisInScan]);

    const labelMap = new Map((escoSkills ?? []).map((s) => [s.esco_uri, s.preferred_label]));

    for (const point of timelinePoints) {
      point.top_skills = (point.top_skills as any[]).map((s) => ({
        ...s,
        preferred_label: labelMap.get(s.esco_uri) ?? s.esco_uri,
      }));
    }
  }

  // Clear and insert
  await supabase.schema('app').from('timeline_points').delete().eq('scan_id', scanId);

  if (timelinePoints.length > 0) {
    await supabase.schema('app').from('timeline_points').insert(timelinePoints);
  }

  logger.info({ scanId, periodCount: timelinePoints.length }, 'Timeline computation complete');
  return timelinePoints.length;
}
