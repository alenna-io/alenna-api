import { Request, Response } from 'express';
import { container } from '../../di/container';

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
        role: user.role,
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
        role: user.role,
        schoolId: user.schoolId,
      });
    } catch (error: any) {
      console.error('Error getting current user:', error);
      res.status(500).json({ error: error.message || 'Failed to get user' });
    }
  }
}

