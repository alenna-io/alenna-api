import { Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma.client';

// Extend Express Request to include user and school context
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      schoolId?: string;
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
    const { userId: clerkId } = (req as any).auth?.() || {};

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

    next();
  } catch (error) {
    console.error('Error in attachUserContext middleware:', error);
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

    // Fetch user's roles from database
    const userRoles = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userRoles || userRoles.userRoles.length === 0) {
      res.status(403).json({ 
        error: 'Forbidden: No roles assigned' 
      });
      return;
    }

    const roleNames = userRoles.userRoles.map(ur => ur.role.name);
    if (!roles.some(r => roleNames.includes(r))) {
      res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions' 
      });
      return;
    }

    next();
  };
};

