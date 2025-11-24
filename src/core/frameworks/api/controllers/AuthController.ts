import { Request, Response } from 'express';
import { container } from '../../di/container';
import { GetUserInfoUseCase, UpdatePasswordUseCase } from '../../../app/use-cases/auth';

export class AuthController {
  async syncUser(req: Request, res: Response): Promise<void> {
    try {
      // Get clerkId from authenticated request
      const { userId: clerkId } = (req as any).auth || {};
      
      if (!clerkId) {
        res.status(401).json({ error: 'Unauthorized: No Clerk user ID found' });
        return;
      }
      
      const user = await container.syncUserUseCase.execute(clerkId);

      res.json({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        schoolId: user.schoolId,
      });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      
      // User not found in database
      if (error.message.includes('User not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      
      const user = await container.getCurrentUserUseCase.execute(userId);

      res.json({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        schoolId: user.schoolId,
      });
    } catch (error: any) {
      console.error('Error getting current user:', error);
      res.status(500).json({ error: error.message || 'Failed to get user' });
    }
  }

  /**
   * GET /api/v1/auth/info
   * Get current user info with roles
   */
  async getUserInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const getUserInfoUseCase = new GetUserInfoUseCase();
      const userInfo = await getUserInfoUseCase.execute(userId);

      res.status(200).json(userInfo);
    } catch (error) {
      console.error('Error getting user info:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error al obtener información del usuario'
      });
    }
  }

  /**
   * POST /api/v1/auth/password
   * Update user password and mark createdPassword as true
   */
  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { userId: clerkId } = (req as any).auth || {};
      const { password } = req.body;

      if (!userId || !clerkId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      if (!password || typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        return;
      }

      const updatePasswordUseCase = new UpdatePasswordUseCase();
      await updatePasswordUseCase.execute({
        userId,
        clerkId,
        password,
      });

      res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error al actualizar la contraseña'
      });
    }
  }
}

