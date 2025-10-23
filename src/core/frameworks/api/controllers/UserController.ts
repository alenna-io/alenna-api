import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CreateUserDTO, UpdateUserDTO } from '../../../app/dtos';

export class UserController {
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUserRoles = req.userRoles || [];
      const isSuperAdmin = currentUserRoles.includes('SUPERADMIN');
      
      // Superadmins can see all users, others only see users from their school
      const schoolId = isSuperAdmin ? undefined : req.schoolId!;
      
      const users = await container.getUsersUseCase.execute(schoolId);

      res.json(users.map(user => ({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolId: user.schoolId,
        roles: user.roles,
        primaryRole: user.primaryRole,
      })));
    } catch (error: any) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: error.message || 'Failed to get users' });
    }
  }

  async getAvailableRoles(_req: Request, res: Response): Promise<void> {
    try {
      const roles = await container.getRolesUseCase.execute();
      res.json(roles);
    } catch (error: any) {
      console.error('Error getting available roles:', error);
      res.status(500).json({ error: error.message || 'Failed to get available roles' });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const currentUserRoles = req.userRoles || [];
      const isSuperAdmin = currentUserRoles.includes('SUPERADMIN');
      
      // Superadmin can create users for any school, others are restricted to their school
      const schoolId = isSuperAdmin ? req.body.schoolId : req.schoolId!;
      
      if (!schoolId) {
        res.status(400).json({ error: 'School ID is required' });
        return;
      }
      
      const validatedData = CreateUserDTO.parse({
        ...req.body,
        schoolId,
      });
      
      const user = await container.createUserUseCase.execute(validatedData);

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        primaryRole: user.primaryRole,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;
      const currentUserRoles = req.userRoles!;
      const validatedData = UpdateUserDTO.parse(req.body);
      
      const user = await container.updateUserUseCase.execute(
        id,
        validatedData,
        currentUserId,
        currentUserRoles
      );

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        primaryRole: user.primaryRole,
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

