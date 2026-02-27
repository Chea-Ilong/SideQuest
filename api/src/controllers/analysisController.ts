import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { runAnalysis } from '../services/orchestratorService.js';

export async function triggerAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id'] as string;

    // Check current status
    const { data: scan } = await supabase
      .schema('app')
      .from('scans')
      .select('status')
      .eq('id', scanId)
      .single();

    if (!scan) {
      throw new AppError('Scan not found', 404, 'SCAN_NOT_FOUND');
    }

    if (scan.status === 'running') {
      throw new AppError('Analysis already running', 409, 'ALREADY_RUNNING');
    }

    // Validate: must have at least one source with status 'done' or 'processing'
    const { data: sources, error: sourcesError } = await supabase
      .schema('app')
      .from('sources')
      .select('id, status')
      .eq('scan_id', scanId);

    if (sourcesError) {
      throw new AppError('Failed to check sources', 500, 'DB_ERROR', sourcesError);
    }

    const activeSources = (sources ?? []).filter(
      (s) => s.status === 'done' || s.status === 'processing' || s.status === 'pending'
    );

    if (activeSources.length === 0) {
      throw new AppError(
        'No sources added. Please add at least one source (GitHub, resume, or manual) before running analysis.',
        400,
        'NO_SOURCES'
      );
    }

    // Update to running
    await supabase
      .schema('app')
      .from('scans')
      .update({ status: 'running', progress: { phase: 'starting', percent: 0, steps_completed: [], errors: [] } })
      .eq('id', scanId);

    // Run analysis in background (don't await)
    runAnalysis(scanId).catch((err) => {
      logger.error({ err, scanId }, 'Analysis pipeline failed');
    });

    logger.info({ scanId, sourceCount: activeSources.length }, 'Analysis started');
    res.json({ message: 'Analysis started', scan_id: scanId });
  } catch (err) {
    next(err);
  }
}
