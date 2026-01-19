import { Request, Response, NextFunction } from 'express';
import prisma from '../../../database/prisma.client';
import { logger } from '../../../../../utils/logger';
import { SchoolStatus, UserStatus } from '@prisma/client';

// Extend Express Request to include user and school context
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      schoolId?: string;
      userRoles?: string[];
    }
  }
}

/**
 * Middleware to attach user and school info to request
 * 
 * MVP: Hardcoded user for development (bypasses Clerk authentication)
 * TODO: Replace with proper Clerk authentication after MVP
 */
export const attachUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // MVP: Hardcoded user - get first active user from database
    // TODO: Replace with Clerk authentication after MVP
    const user = await prisma.user.findFirst({
      where: {
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        school: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!user) {
      logger.warn('No active user found in database for MVP mode');
      res.status(404).json({
        error: 'No active user found. Please create a user in the database.'
      });
      return;
    }

    // Check if school is active
    if (user.school && user.school.status !== SchoolStatus.ACTIVE) {
      res.status(403).json({
        error: 'Your school account has been deactivated. Please contact your administrator.'
      });
      return;
    }

    // Attach user context to request
    req.userId = user.id;
    req.userEmail = user.email;
    req.schoolId = user.schoolId;
    req.userRoles = []; // MVP: Empty roles array (will be populated after auth implementation)

    logger.debug(`MVP: Attached user context - userId: ${user.id}, schoolId: ${user.schoolId}`);
    next();
  } catch (error) {
    logger.error('Error in attachUserContext middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has required role (DEPRECATED - use permission middleware instead)
 * @deprecated Use requirePermission() from permission.middleware instead
 */
export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // MVP: Skip role checking (roles not implemented yet)
    // TODO: Implement role checking after auth is added
    logger.debug(`MVP: Skipping role check for roles: ${roles.join(', ')}`);
    next();
  };
};

