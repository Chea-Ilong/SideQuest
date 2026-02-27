import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';

// Using ml-kmeans and ml-pca for pure JS clustering
// @ts-ignore — these packages have limited type definitions
import { kmeans as KMeans } from 'ml-kmeans';
// @ts-ignore
import { PCA } from 'ml-pca';

const CLUSTER_COLORS = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
];

function silhouetteScore(data: number[][], labels: number[], k: number): number {
  if (k <= 1 || data.length <= k) return 0;
  
  const n = data.length;
  let totalScore = 0;

  for (let i = 0; i < n; i++) {
    const clusterI = labels[i]!;
    const sameCluster = data.filter((_, j) => labels[j] === clusterI && j !== i);
    const otherClusters: Record<number, number[][]> = {};

    for (let j = 0; j < n; j++) {
      const clusterJ = labels[j]!;
      if (clusterJ !== clusterI) {
        if (!otherClusters[clusterJ]) otherClusters[clusterJ] = [];
        otherClusters[clusterJ]!.push(data[j]!);
      }
    }

    const dist = (a: number[], b: number[]) =>
      Math.sqrt(a.reduce((sum, v, idx) => sum + Math.pow(v - (b[idx] ?? 0), 2), 0));

    const avgDist = (points: number[][], target: number[]) =>
      points.length === 0 ? 0 : points.reduce((sum, p) => sum + dist(p, target), 0) / points.length;

    const a = avgDist(sameCluster, data[i]!);
    const b = Math.min(...Object.values(otherClusters).map((pts) => avgDist(pts, data[i]!)));

    const s = a === 0 && b === 0 ? 0 : (b - a) / Math.max(a, b);
    totalScore += s;
  }

  return totalScore / n;
}

export async function computeClusters(scanId: string): Promise<number> {
  logger.info({ scanId }, 'Computing skill clusters');

  // Fetch all skill scores
  const { data: scores, error } = await supabase
    .schema('app')
    .from('user_skill_scores')
    .select('esco_uri, score, top_evidence_ids')
    .eq('scan_id', scanId)
    .order('score', { ascending: false });

  if (error || !scores || scores.length < 2) {
    logger.warn({ scanId, count: scores?.length }, 'Not enough skills to cluster');
    // Create a single default cluster
    if (scores && scores.length >= 1) {
      await createSingleCluster(scanId, scores);
    }
    return 0;
  }

  // Get all sources for this scan (to build co-occurrence vectors)
  const { data: sources } = await supabase
    .schema('app')
    .from('sources')
    .select('id')
    .eq('scan_id', scanId);

  const sourceIds = (sources ?? []).map((s) => s.id);
  const numSources = Math.max(sourceIds.length, 1);

  // Build co-occurrence feature vectors for each skill
  // Vector dimension = number of sources
  // Value = 1 if skill appeared in that source (via evidence chain)
  const { data: evidenceLinks } = await supabase
    .schema('app')
    .from('skill_normalizations')
    .select(`
      esco_uri,
      skill_mentions!inner(
        evidence_items!inner(
          source_id,
          scan_id
        )
      )
    `)
    .eq('skill_mentions.evidence_items.scan_id', scanId)
    .eq('is_primary', true);

  // Build esco_uri → source_id set
  const skillSources = new Map<string, Set<string>>();
  for (const norm of evidenceLinks ?? []) {
    const sourceId = (norm as any).skill_mentions?.evidence_items?.source_id;
    if (!sourceId) continue;
    if (!skillSources.has(norm.esco_uri)) skillSources.set(norm.esco_uri, new Set());
    skillSources.get(norm.esco_uri)!.add(sourceId);
  }

  const uris = scores.map((s) => s.esco_uri);
  
  // Feature matrix: each row is a skill, columns are sources + score dimension
  const featureMatrix = uris.map((uri) => {
    const sourcesForSkill = skillSources.get(uri) ?? new Set();
    const sourceVector = sourceIds.map((sid) => sourcesForSkill.has(sid) ? 1 : 0);
    // Add score as a feature
    const score = scores.find((s) => s.esco_uri === uri)?.score ?? 0;
    return [...sourceVector, score * 2]; // weight score dimension
  });

  // PCA to 2D for visualization
  let coords2D: number[][] = featureMatrix.map((_, i) => [i % 10, Math.floor(i / 10)]); // fallback grid
  try {
    if (featureMatrix[0]!.length >= 2 && uris.length >= 2) {
      const pca = new PCA(featureMatrix, { center: true, scale: true });
      const projected = pca.predict(featureMatrix, { nComponents: 2 });
      coords2D = projected.to2DArray ? projected.to2DArray() : (projected as unknown as number[][]);
    }
  } catch (pcaErr) {
    logger.warn({ pcaErr }, 'PCA failed, using grid layout');
  }

  // Determine optimal k (2 to min(8, skills/3))
  const maxK = Math.min(8, Math.floor(uris.length / 3));
  const minK = Math.max(2, Math.min(3, uris.length - 1));

  let bestK = minK;
  let bestSilhouette = -1;
  let bestLabels: number[] = [];

  for (let k = minK; k <= maxK; k++) {
    try {
      const result = KMeans(featureMatrix, k, { initialization: 'kmeans++', maxIterations: 100 });
      const labels = result.clusters as number[];
      const sil = silhouetteScore(featureMatrix, labels, k);
      if (sil > bestSilhouette) {
        bestSilhouette = sil;
        bestK = k;
        bestLabels = labels;
      }
    } catch {
      break; // k too large
    }
  }

  if (bestLabels.length === 0) {
    // Fallback: single cluster
    await createSingleCluster(scanId, scores);
    return 1;
  }

  // Clear existing clusters for this scan
  await supabase.schema('app').from('clusters').delete().eq('scan_id', scanId);

  // Build cluster groups
  const clusterGroups = new Map<number, string[]>();
  for (let i = 0; i < uris.length; i++) {
    const k = bestLabels[i]!;
    if (!clusterGroups.has(k)) clusterGroups.set(k, []);
    clusterGroups.get(k)!.push(uris[i]!);
  }

  // Get ESCO labels for cluster naming
  const { data: escoSkills } = await supabase
    .schema('ref')
    .from('esco_skills')
    .select('esco_uri, preferred_label')
    .in('esco_uri', uris);

  const labelMap = new Map((escoSkills ?? []).map((s) => [s.esco_uri, s.preferred_label]));

  // Insert clusters
  let clusterIdx = 0;
  for (const [k, clusterUris] of clusterGroups.entries()) {
    // Name cluster by top 3 skills by score
    const topUris = clusterUris
      .sort((a, b) => {
        const sa = scores.find((s) => s.esco_uri === a)?.score ?? 0;
        const sb = scores.find((s) => s.esco_uri === b)?.score ?? 0;
        return sb - sa;
      })
      .slice(0, 3);

    const clusterLabel = topUris
      .map((uri) => labelMap.get(uri) ?? uri.split('/').pop())
      .join(', ');

    // Compute centroid in 2D
    const clusterIdxList = uris
      .map((uri, i) => (clusterUris.includes(uri) ? i : -1))
      .filter((i) => i >= 0);

    const centroidX =
      clusterIdxList.reduce((sum, i) => sum + (coords2D[i]?.[0] ?? 0), 0) / clusterIdxList.length;
    const centroidY =
      clusterIdxList.reduce((sum, i) => sum + (coords2D[i]?.[1] ?? 0), 0) / clusterIdxList.length;

    const { data: cluster } = await supabase
      .schema('app')
      .from('clusters')
      .insert({
        scan_id: scanId,
        label: clusterLabel,
        description: `${clusterUris.length} skills`,
        centroid_x: Math.round(centroidX * 100) / 100,
        centroid_y: Math.round(centroidY * 100) / 100,
        color: CLUSTER_COLORS[clusterIdx % CLUSTER_COLORS.length],
      })
      .select('id')
      .single();

    if (cluster) {
      const memberships = clusterUris.map((uri) => {
        const uriIdx = uris.indexOf(uri);
        const score = scores.find((s) => s.esco_uri === uri)?.score ?? 0;
        return {
          cluster_id: cluster.id,
          esco_uri: uri,
          score,
          x: Math.round((coords2D[uriIdx]?.[0] ?? 0) * 100) / 100,
          y: Math.round((coords2D[uriIdx]?.[1] ?? 0) * 100) / 100,
        };
      });

      await supabase.schema('app').from('cluster_memberships').insert(memberships);
    }

    clusterIdx++;
  }

  logger.info({ scanId, clusterCount: clusterGroups.size, silhouette: bestSilhouette }, 'Clustering complete');
  return clusterGroups.size;
}

async function createSingleCluster(
  scanId: string,
  scores: Array<{ esco_uri: string; score: number }>
): Promise<void> {
  const { data: cluster } = await supabase
    .schema('app')
    .from('clusters')
    .insert({
      scan_id: scanId,
      label: 'All Skills',
      description: `${scores.length} skills`,
      centroid_x: 0,
      centroid_y: 0,
      color: CLUSTER_COLORS[0],
    })
    .select('id')
    .single();

  if (cluster) {
    const memberships = scores.map((s, i) => ({
      cluster_id: cluster.id,
      esco_uri: s.esco_uri,
      score: s.score,
      x: (i % 10) * 1.5,
      y: Math.floor(i / 10) * 1.5,
    }));
    await supabase.schema('app').from('cluster_memberships').insert(memberships);
  }
}
