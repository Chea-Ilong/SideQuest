import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { SkillView, GraphNode, GraphEdge, ClusterView, GapView, TimelinePoint, RoadmapItem } from '../types/index.js';

export async function getSkillsView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id']!;

    // Get skill scores with ESCO info
    const { data: scores, error } = await supabase
      .schema('app')
      .from('user_skill_scores')
      .select(`
        esco_uri,
        score,
        recency_days,
        evidence_count,
        top_evidence_ids
      `)
      .eq('scan_id', scanId)
      .order('score', { ascending: false });

    if (error) throw new AppError('Failed to fetch skills', 500, 'DB_ERROR', error);
    if (!scores || scores.length === 0) {
      res.json({ data: [] });
      return;
    }

    // Get ESCO skill labels
    const uris = scores.map((s) => s.esco_uri);
    const { data: escoSkills } = await supabase
      .schema('ref')
      .from('esco_skills')
      .select('esco_uri, preferred_label, skill_type')
      .in('esco_uri', uris);

    const escoMap = new Map((escoSkills ?? []).map((s) => [s.esco_uri, s]));

    // Get normalization methods for each skill
    const { data: normalizations } = await supabase
      .schema('app')
      .from('skill_normalizations')
      .select('esco_uri, method, score')
      .in('esco_uri', uris)
      .eq('is_primary', true);

    const normMap = new Map((normalizations ?? []).map((n) => [n.esco_uri, n]));

    const skillViews: SkillView[] = scores.map((s) => {
      const esco = escoMap.get(s.esco_uri);
      const norm = normMap.get(s.esco_uri);
      return {
        esco_uri: s.esco_uri,
        preferred_label: esco?.preferred_label ?? s.esco_uri,
        score: s.score,
        evidence_count: s.evidence_count,
        normalization_method: (norm?.method ?? 'exact') as SkillView['normalization_method'],
        normalization_confidence: norm?.score ?? 1,
        evidence: [], // fetched separately via /views/evidence
      };
    });

    res.json({ data: skillViews });
  } catch (err) {
    next(err);
  }
}

export async function getEvidenceView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id']!;
    const limit = Math.min(parseInt((req.query['limit'] as string) ?? '100', 10), 200);
    const offset = parseInt((req.query['offset'] as string) ?? '0', 10);

    const { data, error, count } = await supabase
      .schema('app')
      .from('evidence_items')
      .select(`
        id,
        evidence_type,
        text_snippet,
        strength,
        timestamp,
        ref,
        source_id,
        sources!inner(type)
      `, { count: 'exact' })
      .eq('scan_id', scanId)
      .range(offset, offset + limit - 1)
      .order('strength', { ascending: false });

    if (error) throw new AppError('Failed to fetch evidence', 500, 'DB_ERROR', error);

    res.json({ data: data ?? [], total: count ?? 0 });
  } catch (err) {
    next(err);
  }
}

export async function getMapView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id']!;

    // Get cluster memberships with coordinates
    const { data: memberships, error } = await supabase
      .schema('app')
      .from('cluster_memberships')
      .select(`
        esco_uri,
        score,
        x,
        y,
        cluster_id,
        clusters!inner(label, color)
      `)
      .eq('clusters.scan_id', scanId);

    if (error) throw new AppError('Failed to fetch map data', 500, 'DB_ERROR', error);

    const nodes: GraphNode[] = (memberships ?? []).map((m) => ({
      id: m.esco_uri,
      label: m.esco_uri, // will be replaced by preferred_label below
      score: m.score,
      cluster_id: m.cluster_id,
      cluster_label: (m as any).clusters?.label,
      cluster_color: (m as any).clusters?.color,
      x: m.x,
      y: m.y,
    }));

    // Enrich with ESCO labels
    const uris = nodes.map((n) => n.id);
    if (uris.length > 0) {
      const { data: escoSkills } = await supabase
        .schema('ref')
        .from('esco_skills')
        .select('esco_uri, preferred_label')
        .in('esco_uri', uris);

      const labelMap = new Map((escoSkills ?? []).map((s) => [s.esco_uri, s.preferred_label]));
      nodes.forEach((n) => {
        n.label = labelMap.get(n.id) ?? n.id;
      });
    }

    // Get ESCO skill-skill edges for skills in this scan
    let edges: GraphEdge[] = [];
    if (uris.length > 0) {
      const { data: relations } = await supabase
        .schema('ref')
        .from('esco_skill_relations')
        .select('skill_uri_a, skill_uri_b, relation_type')
        .in('skill_uri_a', uris)
        .in('skill_uri_b', uris)
        .limit(500);

      edges = (relations ?? []).map((r) => ({
        source: r.skill_uri_a,
        target: r.skill_uri_b,
        weight: 0.5,
        type: 'esco_relation' as const,
      }));
    }

    res.json({ data: { nodes, edges } });
  } catch (err) {
    next(err);
  }
}

export async function getClustersView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id']!;

    const { data: clusters, error } = await supabase
      .schema('app')
      .from('clusters')
      .select(`
        id,
        label,
        description,
        color,
        centroid_x,
        centroid_y,
        cluster_memberships(esco_uri, score, x, y)
      `)
      .eq('scan_id', scanId)
      .order('label');

    if (error) throw new AppError('Failed to fetch clusters', 500, 'DB_ERROR', error);

    // Enrich with ESCO labels
    const allUris = (clusters ?? []).flatMap((c) =>
      ((c as any).cluster_memberships ?? []).map((m: any) => m.esco_uri)
    );
    let labelMap = new Map<string, string>();
    if (allUris.length > 0) {
      const { data: escoSkills } = await supabase
        .schema('ref')
        .from('esco_skills')
        .select('esco_uri, preferred_label')
        .in('esco_uri', allUris);
      labelMap = new Map((escoSkills ?? []).map((s) => [s.esco_uri, s.preferred_label]));
    }

    const clusterViews: ClusterView[] = (clusters ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      description: c.description ?? undefined,
      color: c.color,
      centroid_x: c.centroid_x ?? undefined,
      centroid_y: c.centroid_y ?? undefined,
      skills: ((c as any).cluster_memberships ?? [])
        .map((m: any) => ({
          esco_uri: m.esco_uri,
          preferred_label: labelMap.get(m.esco_uri) ?? m.esco_uri,
          score: m.score,
          x: m.x,
          y: m.y,
        }))
        .sort((a: any, b: any) => b.score - a.score),
    }));

    res.json({ data: clusterViews });
  } catch (err) {
    next(err);
  }
}

export async function getGapsView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id']!;
    const targetRole = req.query['role'] as string | undefined;

    let query = supabase
      .schema('app')
      .from('gaps')
      .select('esco_uri, target_weight, user_score, gap_score, rationale, target_role_id')
      .eq('scan_id', scanId)
      .order('gap_score', { ascending: false });

    if (targetRole) {
      query = query.eq('target_role_id', targetRole);
    }

    const { data: gaps, error } = await query;
    if (error) throw new AppError('Failed to fetch gaps', 500, 'DB_ERROR', error);

    // Enrich with ESCO labels
    const uris = (gaps ?? []).map((g) => g.esco_uri);
    let labelMap = new Map<string, string>();
    if (uris.length > 0) {
      const { data: escoSkills } = await supabase
        .schema('ref')
        .from('esco_skills')
        .select('esco_uri, preferred_label')
        .in('esco_uri', uris);
      labelMap = new Map((escoSkills ?? []).map((s) => [s.esco_uri, s.preferred_label]));
    }

    const gapViews: GapView[] = (gaps ?? []).map((g) => ({
      esco_uri: g.esco_uri,
      preferred_label: labelMap.get(g.esco_uri) ?? g.esco_uri,
      target_weight: g.target_weight,
      user_score: g.user_score,
      gap_score: g.gap_score,
      rationale: g.rationale ?? undefined,
    }));

    res.json({ data: gapViews });
  } catch (err) {
    next(err);
  }
}

export async function getTimelineView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id']!;

    const { data, error } = await supabase
      .schema('app')
      .from('timeline_points')
      .select('period_start, period_end, top_skills, cluster_summary')
      .eq('scan_id', scanId)
      .order('period_start');

    if (error) throw new AppError('Failed to fetch timeline', 500, 'DB_ERROR', error);

    const points: TimelinePoint[] = (data ?? []).map((p) => ({
      period_start: p.period_start,
      period_end: p.period_end,
      top_skills: p.top_skills ?? [],
      cluster_summary: p.cluster_summary ?? {},
    }));

    res.json({ data: points });
  } catch (err) {
    next(err);
  }
}

export async function getRoadmapView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id']!;

    const { data, error } = await supabase
      .schema('app')
      .from('roadmap_items')
      .select('id, esco_uri, priority, title, description, estimated_hours, prerequisite_uris, resources')
      .eq('scan_id', scanId)
      .order('priority');

    if (error) throw new AppError('Failed to fetch roadmap', 500, 'DB_ERROR', error);

    // Enrich with ESCO labels
    const uris = (data ?? []).map((r) => r.esco_uri);
    let labelMap = new Map<string, string>();
    if (uris.length > 0) {
      const { data: escoSkills } = await supabase
        .schema('ref')
        .from('esco_skills')
        .select('esco_uri, preferred_label')
        .in('esco_uri', uris);
      labelMap = new Map((escoSkills ?? []).map((s) => [s.esco_uri, s.preferred_label]));
    }

    const items: RoadmapItem[] = (data ?? []).map((r) => ({
      id: r.id,
      esco_uri: r.esco_uri,
      preferred_label: labelMap.get(r.esco_uri) ?? r.esco_uri,
      priority: r.priority,
      title: r.title,
      description: r.description ?? undefined,
      estimated_hours: r.estimated_hours ?? undefined,
      prerequisite_uris: r.prerequisite_uris ?? [],
      resources: r.resources ?? [],
    }));

    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

export async function overrideNormalization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mentionId } = req.params;
    const { esco_uri } = req.body;

    if (!esco_uri) {
      throw new AppError('Missing esco_uri in body', 400, 'MISSING_ESCO_URI');
    }

    // Unset previous primary
    await supabase
      .schema('app')
      .from('skill_normalizations')
      .update({ is_primary: false })
      .eq('mention_id', mentionId);

    // Insert override
    const { data, error } = await supabase
      .schema('app')
      .from('skill_normalizations')
      .upsert({
        mention_id: mentionId,
        esco_uri,
        method: 'manual_override',
        score: 1.0,
        is_primary: true,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to override normalization', 500, 'DB_ERROR', error);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}
