import { supabase } from '../lib/supabase.js';
import { getSkillsForDep } from '../utils/depSkillMap.js';
import { logger } from '../utils/logger.js';
import type { EvidenceType } from '../types/index.js';

interface ManualSkill {
  name: string;
  selfRating?: number;
  yearsExperience?: number;
}

interface ManualProject {
  name: string;
  summary: string;
  stack: string[];
  dateRange?: { start: string; end: string };
  outcomes?: string;
}

interface ManualRole {
  title: string;
  company?: string;
  dateRange?: { start: string; end: string };
  bullets: string[];
}

interface ManualInput {
  skills: ManualSkill[];
  projects: ManualProject[];
  roles: ManualRole[];
}

export async function ingestManualInput(
  sourceId: string,
  scanId: string,
  input: ManualInput
): Promise<void> {
  logger.info({ scanId }, 'Ingesting manual input');

  await supabase
    .schema('app')
    .from('sources')
    .update({ status: 'processing' })
    .eq('id', sourceId);

  const evidenceItems: Array<{
    scan_id: string;
    source_id: string;
    evidence_type: EvidenceType;
    ref: Record<string, unknown>;
    text_snippet: string;
    timestamp?: string;
    strength: number;
  }> = [];

  // Manual skills
  for (const skill of input.skills) {
    const ratingStrength = skill.selfRating ? (skill.selfRating / 5) * 0.6 : 0.4;
    evidenceItems.push({
      scan_id: scanId,
      source_id: sourceId,
      evidence_type: 'manual_claim',
      ref: { selfRating: skill.selfRating, yearsExperience: skill.yearsExperience },
      text_snippet: skill.name,
      strength: Math.round(ratingStrength * 100) / 100,
    });
  }

  // Projects: stack items
  for (const project of input.projects) {
    for (const tech of project.stack) {
      evidenceItems.push({
        scan_id: scanId,
        source_id: sourceId,
        evidence_type: 'manual_claim',
        ref: { project: project.name, role: 'stack_item' },
        text_snippet: tech,
        timestamp: project.dateRange?.start,
        strength: 0.5,
      });
    }
    if (project.summary.length > 10) {
      evidenceItems.push({
        scan_id: scanId,
        source_id: sourceId,
        evidence_type: 'manual_claim',
        ref: { project: project.name, role: 'summary' },
        text_snippet: project.summary.slice(0, 300),
        timestamp: project.dateRange?.start,
        strength: 0.4,
      });
    }
  }

  // Roles: bullet points
  for (const role of input.roles) {
    for (const bullet of role.bullets) {
      if (bullet.trim().length > 5) {
        evidenceItems.push({
          scan_id: scanId,
          source_id: sourceId,
          evidence_type: 'manual_claim',
          ref: { title: role.title, company: role.company },
          text_snippet: bullet.slice(0, 300),
          timestamp: role.dateRange?.start,
          strength: 0.4,
        });
      }
    }
  }

  // Store artifact
  await supabase.schema('app').from('artifacts').insert({
    scan_id: scanId,
    source_id: sourceId,
    type: 'manual_data',
    metadata: {
      skill_count: input.skills.length,
      project_count: input.projects.length,
      role_count: input.roles.length,
      evidence_count: evidenceItems.length,
    },
  });

  // Batch insert
  for (let i = 0; i < evidenceItems.length; i += 500) {
    const { error } = await supabase
      .schema('app')
      .from('evidence_items')
      .insert(evidenceItems.slice(i, i + 500));
    if (error) logger.error({ error, scanId }, 'Failed to insert manual evidence');
  }

  await supabase
    .schema('app')
    .from('sources')
    .update({ status: 'done' })
    .eq('id', sourceId);

  logger.info({ scanId, evidenceCount: evidenceItems.length }, 'Manual input ingested');
}

/**
 * Extract skill mentions from all evidence items for a scan.
 * Creates skill_mentions linked to evidence_items.
 */
export async function extractSkillMentions(scanId: string): Promise<number> {
  logger.info({ scanId }, 'Extracting skill mentions');

  // Fetch all evidence items for this scan
  const { data: evidenceItems, error } = await supabase
    .schema('app')
    .from('evidence_items')
    .select('id, evidence_type, text_snippet, ref, strength')
    .eq('scan_id', scanId);

  if (error || !evidenceItems) {
    logger.error({ error, scanId }, 'Failed to fetch evidence items');
    return 0;
  }

  const mentions: Array<{
    evidence_id: string;
    mention_text: string;
    context_text: string;
    confidence: number;
  }> = [];

  for (const item of evidenceItems) {
    if (!item.text_snippet) continue;

    // For dependencies: use curated mapping
    if (item.evidence_type === 'dependency') {
      const depName = (item.ref as any)?.package ?? item.text_snippet;
      const skills = getSkillsForDep(depName);
      if (skills.length > 0) {
        for (const skill of skills) {
          mentions.push({
            evidence_id: item.id,
            mention_text: skill,
            context_text: `Dependency: ${depName}`,
            confidence: 0.9,
          });
        }
      } else {
        // Use the dep name itself as a mention
        mentions.push({
          evidence_id: item.id,
          mention_text: item.text_snippet,
          context_text: `Dependency in ${(item.ref as any)?.file ?? 'manifest'}`,
          confidence: 0.5,
        });
      }
      continue;
    }

    // For repo languages: direct mapping
    if (item.evidence_type === 'repo_language') {
      mentions.push({
        evidence_id: item.id,
        mention_text: item.text_snippet,
        context_text: `GitHub repository language`,
        confidence: 0.95,
      });
      continue;
    }

    // For topics, bullets, manual claims: extract skill-like terms
    // Simple approach: the snippet itself is the mention (normalization will match to ESCO)
    const text = item.text_snippet;
    
    // Split comma-separated skills lists (common in Skills sections)
    const terms = text.includes(',')
      ? text.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 1 && t.length < 60)
      : [text.slice(0, 100)];

    for (const term of terms.slice(0, 10)) {
      if (term.length > 1) {
        mentions.push({
          evidence_id: item.id,
          mention_text: term,
          context_text: text.slice(0, 200),
          confidence: item.evidence_type === 'manual_claim' ? 0.7 : 0.5,
        });
      }
    }
  }

  // Batch insert mentions
  let inserted = 0;
  for (let i = 0; i < mentions.length; i += 500) {
    const batch = mentions.slice(i, i + 500);
    const { error: insertError } = await supabase
      .schema('app')
      .from('skill_mentions')
      .insert(batch);
    if (insertError) {
      logger.error({ insertError, scanId }, 'Failed to insert mentions batch');
    } else {
      inserted += batch.length;
    }
  }

  logger.info({ scanId, mentionCount: inserted }, 'Skill mention extraction complete');
  return inserted;
}
