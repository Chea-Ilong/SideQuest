import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';

export async function generateRoadmap(scanId: string, targetRoleId = 'fullstack-eng'): Promise<number> {
  logger.info({ scanId, targetRoleId }, 'Generating learning roadmap');

  // Fetch gaps for this scan
  const { data: gaps, error } = await supabase
    .schema('app')
    .from('gaps')
    .select('esco_uri, gap_score, target_weight, user_score')
    .eq('scan_id', scanId)
    .eq('target_role_id', targetRoleId)
    .order('gap_score', { ascending: false });

  if (error || !gaps || gaps.length === 0) {
    logger.info({ scanId }, 'No gaps found for roadmap generation');
    return 0;
  }

  // Fetch ESCO labels
  const uris = gaps.map((g) => g.esco_uri);
  const { data: escoSkills } = await supabase
    .schema('ref')
    .from('esco_skills')
    .select('esco_uri, preferred_label, description')
    .in('esco_uri', uris);

  const escoMap = new Map((escoSkills ?? []).map((s) => [s.esco_uri, s]));

  // Fetch prerequisite hierarchy (broader skills of gap skills)
  const { data: hierarchyData } = await supabase
    .schema('ref')
    .from('esco_hierarchy')
    .select('parent_uri, child_uri')
    .in('child_uri', uris);

  const prereqMap = new Map<string, string[]>();
  for (const edge of hierarchyData ?? []) {
    if (!prereqMap.has(edge.child_uri)) prereqMap.set(edge.child_uri, []);
    prereqMap.get(edge.child_uri)!.push(edge.parent_uri);
  }

  // Build roadmap items
  const roadmapItems = gaps.map((gap, idx) => {
    const esco = escoMap.get(gap.esco_uri);
    const prereqs = prereqMap.get(gap.esco_uri) ?? [];

    // Filter prereqs to only those that are also gaps (relevant)
    const relevantPrereqs = prereqs.filter((uri) => uris.includes(uri));

    // Estimate hours: full gap (1.0) = ~40 hours
    const estimatedHours = Math.round(gap.gap_score * 40);

    return {
      scan_id: scanId,
      esco_uri: gap.esco_uri,
      priority: idx + 1,
      title: `Learn ${esco?.preferred_label ?? gap.esco_uri}`,
      description: esco?.description
        ? esco.description.slice(0, 300)
        : `Improve your ${esco?.preferred_label ?? 'skill'} proficiency from ${Math.round(gap.user_score * 100)}% toward the target of ${Math.round(gap.target_weight * 100)}%.`,
      estimated_hours: estimatedHours > 0 ? estimatedHours : 1,
      prerequisite_uris: relevantPrereqs.slice(0, 3),
      resources: generateResources(esco?.preferred_label ?? gap.esco_uri),
    };
  });

  // Clear and insert
  await supabase.schema('app').from('roadmap_items').delete().eq('scan_id', scanId);

  if (roadmapItems.length > 0) {
    for (let i = 0; i < roadmapItems.length; i += 100) {
      await supabase.schema('app').from('roadmap_items').insert(roadmapItems.slice(i, i + 100));
    }
  }

  logger.info({ scanId, itemCount: roadmapItems.length }, 'Roadmap generation complete');
  return roadmapItems.length;
}

function generateResources(skillName: string): Array<{ title: string; url: string; type: string }> {
  const encoded = encodeURIComponent(skillName);
  return [
    {
      title: `Search: "${skillName}" tutorial`,
      url: `https://www.google.com/search?q=${encoded}+tutorial`,
      type: 'search',
    },
    {
      title: `YouTube: "${skillName}" course`,
      url: `https://www.youtube.com/results?search_query=${encoded}+course`,
      type: 'video',
    },
    {
      title: `MDN: ${skillName}`,
      url: `https://developer.mozilla.org/en-US/search?q=${encoded}`,
      type: 'docs',
    },
  ];
}
