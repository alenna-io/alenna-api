import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          issues: err.errors.map((e: any) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return next(err as Error);
    }
  };
};
