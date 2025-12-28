import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CheckPermissionUseCase } from '../../../app/use-cases/auth/CheckPermissionUseCase';
import { CreateUserDTO, UpdateUserDTO, UpdateUserInput } from '../../../app/dtos';

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
        isActive: user.isActive,
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
      const userId = req.userId!;

      // Check if user only has teachers.create (not users.create)
      const checkPermissionUseCase = new CheckPermissionUseCase();
      let hasOnlyTeachersCreate = false;
      try {
        const hasUsersCreate = await checkPermissionUseCase.execute({ userId, permission: 'users.create' });
        const hasTeachersCreate = await checkPermissionUseCase.execute({ userId, permission: 'teachers.create' });
        hasOnlyTeachersCreate = hasTeachersCreate && !hasUsersCreate;
      } catch (error) {
        // If permission check fails, assume user doesn't have the permission
        console.error('Error checking permissions:', error);
      }

      // Superadmin can create users for any school, others are restricted to their school
      const schoolId = isSuperAdmin ? req.body.schoolId : req.schoolId!;

      if (!schoolId) {
        res.status(400).json({ error: 'School ID is required' });
        return;
      }

      // If user only has teachers.create permission, validate that they're creating a teacher
      if (hasOnlyTeachersCreate) {
        if (!req.body.roleIds || !Array.isArray(req.body.roleIds) || req.body.roleIds.length === 0) {
          res.status(400).json({ error: 'Role is required when creating a teacher' });
          return;
        }

        // Check if the role being assigned is TEACHER role
        const roles = await container.getRolesUseCase.execute();
        const teacherRole = roles.find(r => r.name === 'TEACHER');

        if (!teacherRole || !req.body.roleIds.includes(teacherRole.id)) {
          res.status(403).json({ error: 'You can only create users with TEACHER role' });
          return;
        }
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
        language: user.language,
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

  async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.userId!;
      const currentUserRoles = req.userRoles!;
      const validatedData = UpdateUserDTO.parse(req.body);

      // Only allow updating language, firstName, lastName for own profile
      // Prevent role changes and other sensitive fields
      const allowedFields: Partial<UpdateUserInput> = {};
      if (validatedData.language !== undefined) {
        allowedFields.language = validatedData.language;
      }
      if (validatedData.firstName !== undefined) {
        allowedFields.firstName = validatedData.firstName;
      }
      if (validatedData.lastName !== undefined) {
        allowedFields.lastName = validatedData.lastName;
      }

      const user = await container.updateUserUseCase.execute(
        currentUserId,
        allowedFields,
        currentUserId,
        currentUserRoles
      );

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        language: user.language,
        roles: user.roles,
        primaryRole: user.primaryRole,
      });
    } catch (error: any) {
      console.error('Error updating own profile:', error);

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

      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  }

  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;
      const schoolId = req.schoolId!;
      const currentUserRoles = req.userRoles || [];

      await container.deactivateUserUseCase.execute(id, currentUserId, schoolId, currentUserRoles);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deactivating user:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Cannot deactivate') ||
        error.message.includes('permission') ||
        error.message.includes('already inactive') ||
        error.message.includes('Cannot deactivate parent directly')) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message.includes('does not belong')) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to deactivate user' });
    }
  }

  async reactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;
      const schoolId = req.schoolId!;
      const currentUserRoles = req.userRoles || [];

      await container.reactivateUserUseCase.execute(id, currentUserId, schoolId, currentUserRoles);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error reactivating user:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Cannot reactivate') ||
        error.message.includes('permission') ||
        error.message.includes('already active') ||
        error.message.includes('Cannot reactivate parent directly')) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message.includes('does not belong')) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to reactivate user' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;
      const schoolId = req.schoolId!;
      const currentUserRoles = req.userRoles || [];

      await container.deleteUserUseCase.execute(id, currentUserId, schoolId, currentUserRoles);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting user:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Cannot delete') ||
        error.message.includes('permission') ||
        error.message.includes('Cannot delete active user') ||
        error.message.includes('Cannot delete parent with active students')) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message.includes('does not belong')) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
  }
}

