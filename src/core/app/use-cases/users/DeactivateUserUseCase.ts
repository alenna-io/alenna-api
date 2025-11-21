import { IUserRepository } from '../../../adapters_interface/repositories';
import { clerkService } from '../../../frameworks/services/ClerkService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DeactivateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    currentUserId: string,
    schoolId: string,
    currentUserRoles: string[]
  ): Promise<void> {
    // Cannot deactivate yourself
    if (currentUserId === userId) {
      throw new Error('Cannot deactivate your own account');
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already inactive
    if (!user.isActive) {
      throw new Error('User is already inactive');
    }

    // Check if current user is super admin
    const isSuperAdmin = currentUserRoles.includes('SUPERADMIN');
    const isSchoolAdmin = currentUserRoles.includes('SCHOOL_ADMIN');

    // Super admins can deactivate any user (skip school check)
    // School admins can only deactivate users from their own school
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
    const isTeacher = userRoleNames.includes('TEACHER');

    // Prevent direct parent deactivation - parents must be deactivated through their students
    if (isParent && !isSuperAdmin) {
      throw new Error('Cannot deactivate parent directly. Deactivate the linked student instead.');
    }

    // School admins can only deactivate teachers and students
    if (!isSuperAdmin && isSchoolAdmin && !isTeacher && !isStudent) {
      throw new Error('You can only deactivate teachers and students');
    }

    // Deactivate the user
    await this.userRepository.deactivate(userId);

    // Lock user in Clerk to prevent access (both super admins and school admins can do this)
    if (user.clerkId) {
      try {
        await clerkService.lockUser(user.clerkId);
      } catch (clerkError: any) {
        console.error(`Failed to lock Clerk user ${user.clerkId}:`, clerkError);
        // Continue even if Clerk lock fails - user is already deactivated in DB
        // The middleware will still block access based on isActive flag
      }
    }

    // If deactivating a student, check if we need to deactivate parents
    if (isStudent) {
      await this.handleStudentDeactivation(userId);
    }
  }

  /**
   * Handle student deactivation:
   * - If the student is deactivated, check all parents linked to this student
   * - If a parent has no more active students, deactivate the parent as well
   */
  private async handleStudentDeactivation(studentUserId: string): Promise<void> {
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

    // For each parent, check if they have other active students
    for (const parentUserId of parentUserIds) {
      const activeStudents = await prisma.userStudent.findMany({
        where: {
          userId: parentUserId,
          student: {
            deletedAt: null, // Only count non-deleted students
            user: {
              isActive: true, // Only count active students
            },
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

      // Filter out the student being deactivated
      const otherActiveStudents = activeStudents.filter(
        (us) => us.student.id !== student.id
      );

      // If parent has no other active students, deactivate the parent
      if (otherActiveStudents.length === 0) {
        await this.userRepository.deactivate(parentUserId);
      }
    }
  }
}

