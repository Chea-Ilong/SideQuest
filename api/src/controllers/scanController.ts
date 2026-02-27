import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export async function createScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = req.body?.config ?? {};

    const { data, error } = await supabase
      .schema('app')
      .from('scans')
      .insert({ config })
      .select('id, share_token, status, created_at, config')
      .single();

    if (error || !data) {
      throw new AppError('Failed to create scan', 500, 'DB_ERROR', error);
    }

    logger.info({ scanId: data.id }, 'Scan created');
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, error } = await supabase
      .schema('app')
      .from('scans')
      .select('id, share_token, status, created_at, updated_at, config, progress, error_details')
      .eq('id', req.params['id']!)
      .single();

    if (error || !data) {
      throw new AppError('Scan not found', 404, 'SCAN_NOT_FOUND');
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getScanStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, error } = await supabase
      .schema('app')
      .from('scans')
      .select('status, progress, error_details, updated_at')
      .eq('id', req.params['id']!)
      .single();

    if (error || !data) {
      throw new AppError('Scan not found', 404, 'SCAN_NOT_FOUND');
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function deleteScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scanId = req.params['id']!;

    // Get storage paths before deleting
    const { data: artifacts } = await supabase
      .schema('app')
      .from('artifacts')
      .select('storage_path')
      .eq('scan_id', scanId)
      .not('storage_path', 'is', null);

    const storagePaths = (artifacts ?? [])
      .map((a) => a.storage_path)
      .filter(Boolean) as string[];

    // Delete storage objects
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove(storagePaths);
      if (storageError) {
        logger.warn({ storageError, scanId }, 'Failed to delete some storage objects');
      }
    }

    // Log deletion before removing rows
    await supabase
      .schema('app')
      .from('deletion_log')
      .insert({
        scan_id: scanId,
        storage_paths_deleted: storagePaths,
        details: { source: 'user_delete' },
      });

    // Delete scan (cascades to all child tables)
    const { error } = await supabase
      .schema('app')
      .from('scans')
      .delete()
      .eq('id', scanId);

    if (error) {
      throw new AppError('Failed to delete scan', 500, 'DB_ERROR', error);
    }

    logger.info({ scanId, storagePathsDeleted: storagePaths.length }, 'Scan deleted');
    res.json({ deleted: true, scan_id: scanId });
  } catch (err) {
    next(err);
  }
}
