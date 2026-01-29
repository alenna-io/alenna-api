import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { createClerkClient } from '@clerk/backend';
import { config } from '../../../../../config/env';
import { logger } from '../../../../../utils/logger';
import prisma from '../../../database/prisma.client';
import { SchoolStatus } from '@prisma/client';

const clerk = createClerkClient({
  secretKey: config.clerk.secretKey,
});

// Extend Express Request to include user and school context
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      schoolId?: string;
      userRoles?: string[];
      clerkUserId?: string;
    }
  }
}

/**
 * Middleware to authenticate user with Clerk and attach user context to request
 */
export const attachUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, sessionId } = getAuth(req);

    logger.info('[attachUserContext] Clerk userId:', userId);
    logger.info('[attachUserContext] sessionId:', sessionId);

    if (!userId || !sessionId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in.',
      });
      return;
    }

    const user = await clerk.users.getUser(userId);

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found.',
      });
      return;
    }

    const primaryEmailAddress = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmailAddress) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'User email not found.',
      });
      return;
    }

    logger.info('[attachUserContext] Looking up user by clerkId:', userId);
    const dbUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
      include: {
        school: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    logger.info('[attachUserContext] dbUser found:', dbUser ? {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      hasSchool: !!dbUser.school,
    } : null);

    if (!dbUser) {
      logger.error('[attachUserContext] User not found in database for clerkId:', userId);
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database. Please contact your administrator.',
      });
      return;
    }

    if (dbUser.deletedAt) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Your account has been deactivated.',
      });
      return;
    }

    if (dbUser.school && dbUser.school.status !== SchoolStatus.ACTIVE) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Your school account has been deactivated. Please contact your administrator.',
      });
      return;
    }

    req.clerkUserId = userId;
    req.userId = dbUser.id;
    req.userEmail = primaryEmailAddress.emailAddress;
    req.schoolId = dbUser.schoolId;
    req.userRoles = dbUser.userRoles.map((ur) => ur.role.name.toLowerCase());

    logger.info('[attachUserContext] Setting req.userId to:', req.userId);
    logger.info('[attachUserContext] req.userId type:', typeof req.userId);
    logger.info('[attachUserContext] req.userId length:', req.userId?.length);

    next();
  } catch (error) {
    logger.error('Error in attachUserContext middleware:', error);

    if (error instanceof Error && error.message.includes('401')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token.',
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication.',
    });
  }
};

/**
 * Middleware to require school admin role
 */
export const requireSchoolAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  const roles = req.userRoles || [];
  const hasSchoolAdminRole = roles.includes('school_admin');

  if (!hasSchoolAdminRole) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'School admin role required to access this resource.',
    });
    return;
  }

  next();
};

