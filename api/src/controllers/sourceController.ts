import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { ingestGitHub } from '../services/githubService.js';
import { processResumeUpload } from '../services/resumeService.js';
import { ingestManualInput } from '../services/evidenceService.js';
import { logger } from '../utils/logger.js';

const ManualInputSchema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string().min(1),
        selfRating: z.number().min(1).max(5).optional(),
        yearsExperience: z.number().min(0).optional(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().min(1),
        summary: z.string().default(''),
        stack: z.array(z.string()).default([]),
        dateRange: z
          .object({ start: z.string(), end: z.string() })
          .optional(),
        outcomes: z.string().optional(),
      })
    )
    .default([]),
  roles: z
    .array(
      z.object({
        title: z.string().min(1),
        company: z.string().optional(),
        dateRange: z
          .object({ start: z.string(), end: z.string() })
          .optional(),
        bullets: z.array(z.string()).default([]),
      })
    )
    .default([]),
});

export async function addSource(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id'] as string;
    const sourceType = req.body?.type ?? (req.file ? 'resume' : undefined);

    if (!sourceType) {
      throw new AppError('Missing source type', 400, 'MISSING_TYPE');
    }

    if (sourceType === 'github') {
      const { username, token } = req.body ?? {};
      if (!username) throw new AppError('Missing GitHub username', 400, 'MISSING_GITHUB_USERNAME');

      const { data: source, error } = await supabase
        .schema('app')
        .from('sources')
        .insert({ scan_id: scanId, type: 'github', config: { username } })
        .select()
        .single();

      if (error || !source) throw new AppError('Failed to create source', 500, 'DB_ERROR', error);

      // Run ingest in background
      ingestGitHub(source.id, scanId, username, token).catch((err) =>
        logger.error({ err, scanId, username }, 'GitHub ingest failed')
      );

      res.status(201).json({ data: source, message: 'GitHub ingest started' });
      return;
    }

    if (sourceType === 'resume') {
      if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');

      const { data: source, error } = await supabase
        .schema('app')
        .from('sources')
        .insert({
          scan_id: scanId,
          type: 'resume',
          config: { filename: req.file.originalname, mimeType: req.file.mimetype },
        })
        .select()
        .single();

      if (error || !source) throw new AppError('Failed to create source', 500, 'DB_ERROR', error);

      await processResumeUpload(source.id, scanId, req.file);
      res.status(201).json({ data: source, message: 'Resume processed' });
      return;
    }

    if (sourceType === 'manual') {
      const parsed = ManualInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Invalid manual input', 400, 'VALIDATION_ERROR', parsed.error.issues);
      }

      const { data: source, error } = await supabase
        .schema('app')
        .from('sources')
        .insert({ scan_id: scanId, type: 'manual', config: {} })
        .select()
        .single();

      if (error || !source) throw new AppError('Failed to create source', 500, 'DB_ERROR', error);

      await ingestManualInput(source.id, scanId, parsed.data);
      res.status(201).json({ data: source, message: 'Manual input stored' });
      return;
    }

    throw new AppError(`Unknown source type: ${sourceType}`, 400, 'UNKNOWN_SOURCE_TYPE');
  } catch (err) {
    next(err);
  }
}
