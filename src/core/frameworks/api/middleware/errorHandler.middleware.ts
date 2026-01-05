import { Request, Response, NextFunction } from 'express';
import { ObjectAlreadyExistsError } from '../../../app/errors/v2/ObjectAlreadyExistsError';
import { ZodError } from 'zod';

export function errorHandler(err: any, _: Request, res: Response, _next: NextFunction): Response {
  console.error(err); // keep full stack in server logs

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
  if (err instanceof ObjectAlreadyExistsError) {
    return res.status(err.statusCode).json({
      error: err.message, // only message
      // remove stack for API responses
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }

  // fallback
  return res.status(500).json({
    error: 'Internal server error',
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
}
