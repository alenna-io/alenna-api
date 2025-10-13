import { Request, Response } from 'express';
import { container } from '../../di/container';
import { SyncUserDTO } from '../../../app/dtos';

export class AuthController {
  async syncUser(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = SyncUserDTO.parse(req.body);
      
      const user = await container.syncUserUseCase.execute(validatedData);

      res.json({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
      });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
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
        role: user.role,
        schoolId: user.schoolId,
      });
    } catch (error: any) {
      console.error('Error getting current user:', error);
      res.status(500).json({ error: error.message || 'Failed to get user' });
    }
  }
}

