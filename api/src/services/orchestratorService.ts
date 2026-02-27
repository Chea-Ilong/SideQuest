import { supabase } from '../lib/supabase.js';
import { extractSkillMentions } from './evidenceService.js';
import { normalizeSkillMentions } from './normalizationService.js';
import { computeSkillScores } from './scoringService.js';
import { computeClusters } from './clusteringService.js';
import { computeTimeline } from './timelineService.js';
import { computeGaps } from './gapService.js';
import { generateRoadmap } from './roadmapService.js';
import { logger } from '../utils/logger.js';

type Phase =
  | 'waiting_for_sources'
  | 'extracting_mentions'
  | 'normalizing'
  | 'scoring'
  | 'clustering'
  | 'timeline'
  | 'gaps'
  | 'roadmap'
  | 'done';

async function updateProgress(
  scanId: string,
  phase: Phase,
  percent: number,
  stepsCompleted: string[],
  errors: string[] = []
): Promise<void> {
  await supabase
    .schema('app')
    .from('scans')
    .update({
      updated_at: new Date().toISOString(),
      progress: { phase, percent, steps_completed: stepsCompleted, errors },
    })
    .eq('id', scanId);
}

export async function runAnalysis(scanId: string): Promise<void> {
  logger.info({ scanId }, 'Analysis pipeline started');
  const stepsCompleted: string[] = [];
  const errors: string[] = [];

  try {
    // Wait for sources to finish processing (up to 5 minutes)
    await updateProgress(scanId, 'waiting_for_sources', 5, stepsCompleted);

    const maxWait = 5 * 60 * 1000;
    const pollInterval = 3000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const { data: sources } = await supabase
        .schema('app')
        .from('sources')
        .select('status')
        .eq('scan_id', scanId);

      const allDone = (sources ?? []).every(
        (s) => s.status === 'done' || s.status === 'error'
      );

      if (allDone) break;
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    stepsCompleted.push('sources_ingested');
    await updateProgress(scanId, 'extracting_mentions', 15, stepsCompleted);

    // Step 1: Extract skill mentions
    const mentionCount = await extractSkillMentions(scanId);
    stepsCompleted.push(`mention_extraction:${mentionCount}`);
    await updateProgress(scanId, 'normalizing', 30, stepsCompleted);

    // Step 2: Normalize mentions to ESCO
    const normalizedCount = await normalizeSkillMentions(scanId);
    stepsCompleted.push(`normalization:${normalizedCount}`);
    await updateProgress(scanId, 'scoring', 50, stepsCompleted);

    // Step 3: Compute skill scores
    const skillCount = await computeSkillScores(scanId);
    stepsCompleted.push(`scoring:${skillCount}`);
    await updateProgress(scanId, 'clustering', 65, stepsCompleted);

    // Step 4: Compute clusters + coordinates
    await computeClusters(scanId).catch((err) => {
      errors.push(`clustering: ${String(err)}`);
      logger.warn({ err, scanId }, 'Clustering failed, continuing');
    });
    stepsCompleted.push('clustering');
    await updateProgress(scanId, 'timeline', 75, stepsCompleted, errors);

    // Step 5: Compute timeline
    await computeTimeline(scanId).catch((err) => {
      errors.push(`timeline: ${String(err)}`);
      logger.warn({ err, scanId }, 'Timeline failed, continuing');
    });
    stepsCompleted.push('timeline');
    await updateProgress(scanId, 'gaps', 85, stepsCompleted, errors);

    // Step 6: Compute gaps
    const { data: scan } = await supabase
      .schema('app')
      .from('scans')
      .select('config')
      .eq('id', scanId)
      .single();

    const targetRole = (scan?.config as any)?.targetRole ?? 'fullstack-eng';
    await computeGaps(scanId, targetRole).catch((err) => {
      errors.push(`gaps: ${String(err)}`);
      logger.warn({ err, scanId }, 'Gap analysis failed, continuing');
    });
    stepsCompleted.push('gaps');
    await updateProgress(scanId, 'roadmap', 93, stepsCompleted, errors);

    // Step 7: Generate roadmap
    await generateRoadmap(scanId, targetRole).catch((err) => {
      errors.push(`roadmap: ${String(err)}`);
      logger.warn({ err, scanId }, 'Roadmap generation failed, continuing');
    });
    stepsCompleted.push('roadmap');

    // Done
    await supabase
      .schema('app')
      .from('scans')
      .update({
        status: errors.length > 0 ? 'ready' : 'ready', // partial results still marked ready
        updated_at: new Date().toISOString(),
        progress: { phase: 'done', percent: 100, steps_completed: stepsCompleted, errors },
      })
      .eq('id', scanId);

    logger.info({ scanId, skillCount, mentionCount, normalizedCount, errors }, 'Analysis pipeline complete');
  } catch (err) {
    logger.error({ err, scanId }, 'Analysis pipeline fatal error');
    await supabase
      .schema('app')
      .from('scans')
      .update({
        status: 'error',
        updated_at: new Date().toISOString(),
        error_details: { message: String(err), steps_completed: stepsCompleted, errors },
        progress: { phase: 'error', percent: 0, steps_completed: stepsCompleted, errors: [...errors, String(err)] },
      })
      .eq('id', scanId);
  }
}
