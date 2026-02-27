import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { AppError } from './errorHandler.js';

// Extends Express request to carry the validated scan
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      scanId?: string;
    }
  }
}

/**
 * Middleware: validate share_token for scan endpoints.
 * Token can be passed as:
 *   - query param: ?share_token=xxx
 *   - header: x-share-token: xxx
 *
 * Sets req.scanId on success.
 */
export async function requireShareToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    (req.query['share_token'] as string) ||
    req.headers['x-share-token'] as string;

  if (!token) {
    next(new AppError('Missing share_token', 403, 'MISSING_TOKEN'));
    return;
  }

  // Verify token belongs to the scan in the URL
  const scanId = req.params['id'];
  if (!scanId) {
    next(new AppError('Missing scan id', 400, 'MISSING_SCAN_ID'));
    return;
  }

  const { data, error } = await supabase
    .schema('app')
    .from('scans')
    .select('id, share_token')
    .eq('id', scanId)
    .eq('share_token', token)
    .single();

  if (error || !data) {
    next(new AppError('Invalid or expired share token', 403, 'INVALID_TOKEN'));
    return;
  }

  req.scanId = data.id;
  next();
}
