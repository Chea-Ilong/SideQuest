import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof Error) {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
    return;
  }

  logger.error({ err }, 'Unknown error');
  res.status(500).json({ error: { message: 'Unknown error' } });
}
