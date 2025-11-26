import { IUserRepository } from '../../../adapters_interface/repositories';
import { clerkService } from '../../../frameworks/services/ClerkService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    currentUserId: string,
    schoolId: string,
    currentUserRoles: string[]
  ): Promise<void> {
    // Cannot delete yourself
    if (currentUserId === userId) {
      throw new Error('Cannot delete your own account');
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is inactive - can only delete inactive users
    if (user.isActive) {
      throw new Error('Cannot delete active user. Deactivate the user first.');
    }

    // Check if current user is super admin
    const isSuperAdmin = currentUserRoles.includes('SUPERADMIN');

    // Super admins can delete any inactive user (skip school check)
    // School admins can only delete inactive users from their own school
    if (!isSuperAdmin && user.schoolId !== schoolId) {
      throw new Error('User does not belong to your school');
    }

    // Get user's roles to determine if they are a student or parent
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const userRoleNames = userRoles.map((ur) => ur.role.name);
    const isStudent = userRoleNames.includes('STUDENT');
    const isParent = userRoleNames.includes('PARENT');

    // If deleting a student, check if we need to delete parents
    if (isStudent) {
      await this.handleStudentDeletion(userId);
    } else if (isParent) {
      // When deleting a parent, ensure the linked student is also inactive
      const linkedStudents = await prisma.userStudent.findMany({
        where: { userId },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Check if any linked student is still active
      const hasActiveStudents = linkedStudents.some(
        (us) => us.student.user.isActive && !us.student.user.deletedAt
      );

      if (hasActiveStudents) {
        throw new Error('Cannot delete parent with active students. Deactivate the students first.');
      }
    }

    // Super admin: Delete from Clerk before soft deleting
    if (isSuperAdmin && user.clerkId) {
      try {
        // Delete user from Clerk
        await clerkService.deleteUser(user.clerkId);
      } catch (clerkError: any) {
        console.error(`Failed to delete Clerk user ${user.clerkId}:`, clerkError);
        throw new Error(`Failed to delete user from Clerk: ${clerkError.message || 'Unknown error'}`);
      }
    }

    // Soft delete from database and clear clerkId
    await this.userRepository.delete(userId);
    
    // Clear clerkId if it was deleted from Clerk
    if (isSuperAdmin && user.clerkId) {
      await prisma.user.update({
        where: { id: userId },
        data: { clerkId: null },
      });
    }
  }

  /**
   * Handle student deletion:
   * - If the student is deleted, check all parents linked to this student
   * - If a parent has no more students (active or inactive), delete the parent as well
   */
  private async handleStudentDeletion(studentUserId: string): Promise<void> {
    // Find the student record
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        userStudents: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!student) {
      return; // Not a student, nothing to do
    }

    // Get all parents linked to this student
    const parentUserIds = student.userStudents.map((us) => us.userId);

    // For each parent, check if they have other students (active or inactive, but not deleted)
    for (const parentUserId of parentUserIds) {
      const otherStudents = await prisma.userStudent.findMany({
        where: {
          userId: parentUserId,
          student: {
            id: { not: student.id }, // Exclude the student being deleted
            deletedAt: null, // Only count non-deleted students
          },
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // If parent has no other students (all deleted), delete the parent
      // Note: findById won't return deleted users, so if it returns a user, they're not deleted yet
      if (otherStudents.length === 0) {
        const parent = await this.userRepository.findById(parentUserId);
        if (parent) {
          await this.userRepository.delete(parentUserId);
        }
      }
    }
  }
}

