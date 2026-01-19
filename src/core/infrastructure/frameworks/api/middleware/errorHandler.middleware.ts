import { Request, Response, NextFunction } from 'express';
import { ObjectAlreadyExistsError, InvalidEntityError, ObjectNotFoundError } from '../../../../domain/errors';
import { ZodError } from 'zod';
import { logger } from '../../../../../utils/logger';

export function errorHandler(err: any, _: Request, res: Response, _next: NextFunction): Response {
  logger.error('Error occurred:', err);

  // JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      message: err.message,
    });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Domain / business errors
  if (err instanceof InvalidEntityError) {
    return res.status(err.statusCode).json({
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }

  if (err instanceof ObjectAlreadyExistsError) {
    return res.status(err.statusCode).json({
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }

  if (err instanceof ObjectNotFoundError) {
    return res.status(err.statusCode).json({
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }

  // fallback
  return res.status(500).json({
    error: 'Internal server error',
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
}
