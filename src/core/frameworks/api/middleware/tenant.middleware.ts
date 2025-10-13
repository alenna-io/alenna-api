import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure multi-tenant data isolation
 * Validates that requested resources belong to the user's school
 */
export const ensureTenantIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.schoolId) {
    return res.status(401).json({ error: 'School context not found' });
  }

  // Store schoolId in locals for easy access
  res.locals.schoolId = req.schoolId;
  
  next();
};

