import { Request, Response, NextFunction } from 'express';
import { ObjectAlreadyExistsError, InvalidEntityError, ObjectNotFoundError } from '../../../../domain/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
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

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (P2002)
    if (err.code === 'P2002') {
      const target = err.meta?.target as string[] | undefined;
      const modelName = err.meta?.modelName as string | undefined;

      // Generate a user-friendly error message
      let message = 'A record with this combination already exists';
      if (target && target.length > 0) {
        const fieldNames = target.map(field => {
          // Convert snake_case to Title Case
          return field.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        });
        message = `A ${modelName || 'record'} with this ${fieldNames.join(', ')} already exists`;
      }

      return res.status(409).json({
        error: message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    }

    // Record not found (P2025)
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    }

    // Foreign key constraint violation (P2003)
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid reference: related record does not exist',
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    }

    // Other Prisma errors
    return res.status(400).json({
      error: err.message || 'Database operation failed',
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
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
