import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';

export async function computeGaps(scanId: string, targetRoleId?: string): Promise<number> {
  const roleId = targetRoleId ?? 'fullstack-eng'; // default role
  logger.info({ scanId, roleId }, 'Computing skill gaps');

  // Fetch target role
  const { data: role, error: roleError } = await supabase
    .schema('ref')
    .from('target_roles')
    .select('id, name, skills')
    .eq('id', roleId)
    .single();

  if (roleError || !role) {
    logger.warn({ roleId }, 'Target role not found, skipping gap analysis');
    return 0;
  }

  const targetSkills = role.skills as Array<{ preferred_label: string; weight: number; esco_uri?: string }>;

  // Resolve ESCO URIs for target skills by label if not already present
  const resolvedSkills: Array<{ esco_uri: string; preferred_label: string; weight: number }> = [];
  for (const ts of targetSkills) {
    if (ts.esco_uri) {
      resolvedSkills.push({ esco_uri: ts.esco_uri, preferred_label: ts.preferred_label, weight: ts.weight });
      continue;
    }

    // Look up by label
    const { data: escoMatch } = await supabase
      .schema('ref')
      .from('esco_skills')
      .select('esco_uri, preferred_label')
      .ilike('preferred_label', ts.preferred_label)
      .limit(1)
      .single();

    if (escoMatch) {
      resolvedSkills.push({ esco_uri: escoMatch.esco_uri, preferred_label: escoMatch.preferred_label, weight: ts.weight });
    } else {
      // Try alias match
      const { data: aliasMatch } = await supabase
        .schema('ref')
        .from('esco_skill_aliases')
        .select('esco_uri')
        .ilike('alias', ts.preferred_label)
        .limit(1)
        .single();

      if (aliasMatch) {
        resolvedSkills.push({ esco_uri: aliasMatch.esco_uri, preferred_label: ts.preferred_label, weight: ts.weight });
      }
    }
  }

  // Fetch user's skill scores for this scan
  const { data: userScores } = await supabase
    .schema('app')
    .from('user_skill_scores')
    .select('esco_uri, score')
    .eq('scan_id', scanId);

  const userScoreMap = new Map((userScores ?? []).map((s) => [s.esco_uri, s.score]));

  // Compute gaps
  const gaps = resolvedSkills.map((ts) => {
    const userScore = userScoreMap.get(ts.esco_uri) ?? 0;
    const gapScore = ts.weight * (1 - userScore);
    return {
      scan_id: scanId,
      esco_uri: ts.esco_uri,
      target_role_id: roleId,
      target_weight: ts.weight,
      user_score: Math.round(userScore * 100) / 100,
      gap_score: Math.round(gapScore * 1000) / 1000,
      rationale: userScore === 0
        ? `No evidence of ${ts.preferred_label} found in your profile`
        : `Your ${ts.preferred_label} score (${Math.round(userScore * 100)}%) is below target (${Math.round(ts.weight * 100)}%)`,
    };
  }).filter((g) => g.gap_score > 0.05); // filter out tiny gaps

  // Delete existing gaps for this scan+role, then insert
  await supabase
    .schema('app')
    .from('gaps')
    .delete()
    .eq('scan_id', scanId)
    .eq('target_role_id', roleId);

  if (gaps.length > 0) {
    await supabase.schema('app').from('gaps').insert(gaps);
  }

  logger.info({ scanId, gapCount: gaps.length }, 'Gap analysis complete');
  return gaps.length;
}

export async function getTargetRoles(): Promise<Array<{ id: string; name: string; description: string }>> {
  const { data } = await supabase
    .schema('ref')
    .from('target_roles')
    .select('id, name, description')
    .order('name');
  return data ?? [];
}
