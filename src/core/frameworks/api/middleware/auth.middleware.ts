import { Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma.client';

// Extend Express Request to include user and school context
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      schoolId?: string;
      userRole?: string;
    }
  }
}

/**
 * Middleware to attach user and school info to request
 * Must be used after Clerk authentication middleware
 */
export const attachUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId: clerkId } = (req as any).auth || {};

    if (!clerkId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { school: true },
    });

    if (!user) {
      res.status(404).json({ 
        error: 'User not found in system. Please complete registration.' 
      });
      return;
    }

    // Attach user context to request
    req.userId = user.id;
    req.userEmail = user.email;
    req.schoolId = user.schoolId;
    req.userRole = user.role;

    next();
  } catch (error) {
    console.error('Error in attachUserContext middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.userRole)) {
      res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions' 
      });
      return;
    }

    next();
  };
};

