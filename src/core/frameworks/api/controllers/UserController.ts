import { Request, Response } from 'express';
import { container } from '../../di/container';
import { UpdateUserDTO } from '../../../app/dtos';

export class UserController {
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      
      const users = await container.getUsersUseCase.execute(schoolId);

      res.json(users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })));
    } catch (error: any) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: error.message || 'Failed to get users' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;
      const currentUserRole = req.userRole!;
      const validatedData = UpdateUserDTO.parse(req.body);
      
      const user = await container.updateUserUseCase.execute(
        id,
        validatedData,
        currentUserId,
        currentUserRole
      );

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message.includes('Forbidden')) {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to update user' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;
      const schoolId = req.schoolId!;
      
      await container.deleteUserUseCase.execute(id, currentUserId, schoolId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message.includes('Cannot delete')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
  }
}

