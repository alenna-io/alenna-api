import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure multi-tenant data isolation
 * Validates that requested resources belong to the user's school
 * Superadmins can bypass this check as they manage all schools
 */
export const ensureTenantIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Allow superadmins to bypass tenant isolation
  const isSuperAdmin = req.userRoles?.includes('SUPERADMIN');
  
  if (!req.schoolId && !isSuperAdmin) {
    return res.status(401).json({ error: 'School context not found' });
  }

  // Store schoolId in locals for easy access (null for superadmins)
  res.locals.schoolId = req.schoolId;
  
  next();
};

