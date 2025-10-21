import { Request, Response, NextFunction } from 'express';
import { CheckPermissionUseCase } from '../../../app/use-cases/auth';

/**
 * Permission middleware factory
 * Usage: router.get('/students', requirePermission('students.read'), controller.getStudents)
 */
export function requirePermission(permission: string, options?: {
  checkOwnership?: boolean; // If true, extract studentId from params/body
  ownerIdParam?: string; // Name of param containing resource owner ID (default: 'studentId')
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get internal user ID from context (set by attachUserContext middleware)
      const userId = (req as any).userId;
      
      if (!userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Get resource owner ID if checking ownership
      let resourceOwnerId: string | undefined;
      if (options?.checkOwnership) {
        const paramName = options.ownerIdParam || 'studentId';
        resourceOwnerId = req.params[paramName] || req.body[paramName];
      }

      const checkPermissionUseCase = new CheckPermissionUseCase();
      
      await checkPermissionUseCase.enforcePermission({
        userId,
        permission,
        resourceOwnerId,
      });

      // Permission granted - continue
      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      res.status(403).json({ 
        error: error instanceof Error ? error.message : 'No tienes permiso para realizar esta acción'
      });
    }
  };
}

/**
 * Check multiple permissions (user must have at least ONE)
 */
export function requireAnyPermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get internal user ID from context (set by attachUserContext middleware)
      const userId = (req as any).userId;
      
      if (!userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const checkPermissionUseCase = new CheckPermissionUseCase();
      
      // Check if user has ANY of the permissions
      const hasAnyPermission = await Promise.all(
        permissions.map(permission =>
          checkPermissionUseCase.execute({ userId, permission })
        )
      );

      if (!hasAnyPermission.some(result => result)) {
        res.status(403).json({ 
          error: 'No tienes permiso para realizar esta acción'
        });
        return;
      }

      // Permission granted - continue
      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      res.status(403).json({ 
        error: 'No tienes permiso para realizar esta acción'
      });
    }
  };
}

/**
 * Check multiple permissions (user must have ALL)
 */
export function requireAllPermissions(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get internal user ID from context (set by attachUserContext middleware)
      const userId = (req as any).userId;
      
      if (!userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const checkPermissionUseCase = new CheckPermissionUseCase();
      
      // Check if user has ALL of the permissions
      const hasAllPermissions = await Promise.all(
        permissions.map(permission =>
          checkPermissionUseCase.execute({ userId, permission })
        )
      );

      if (!hasAllPermissions.every(result => result)) {
        res.status(403).json({ 
          error: 'No tienes permiso para realizar esta acción'
        });
        return;
      }

      // Permission granted - continue
      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      res.status(403).json({ 
        error: error instanceof Error ? error.message : 'No tienes permiso para realizar esta acción'
      });
    }
  };
}

/**
 * Helper to check permission within use cases (not middleware)
 * Usage: await checkPermission(userId, 'students.read')
 */
export async function checkPermission(
  userId: string,
  permission: string,
  resourceOwnerId?: string
): Promise<void> {
  const checkPermissionUseCase = new CheckPermissionUseCase();
  await checkPermissionUseCase.enforcePermission({
    userId,
    permission,
    resourceOwnerId,
  });
}

