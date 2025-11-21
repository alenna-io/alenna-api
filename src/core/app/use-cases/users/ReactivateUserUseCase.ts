import { IUserRepository } from '../../../adapters_interface/repositories';
import { clerkService } from '../../../frameworks/services/ClerkService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReactivateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    _currentUserId: string,
    schoolId: string,
    currentUserRoles: string[]
  ): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already active
    if (user.isActive) {
      throw new Error('User is already active');
    }

    // Check if current user is super admin
    const isSuperAdmin = currentUserRoles.includes('SUPERADMIN');
    const isSchoolAdmin = currentUserRoles.includes('SCHOOL_ADMIN');

    // Super admins can reactivate any user (skip school check)
    // School admins can only reactivate users from their own school
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

    // Prevent direct parent reactivation - parents are reactivated automatically when student is reactivated
    if (isParent && !isSuperAdmin) {
      throw new Error('Cannot reactivate parent directly. Reactivate the linked student instead.');
    }

    // School admins can only reactivate teachers and students
    if (!isSuperAdmin && isSchoolAdmin && !isTeacher && !isStudent) {
      throw new Error('You can only reactivate teachers and students');
    }

    // Reactivate the user
    await this.userRepository.reactivate(userId);

    // Unlock user in Clerk to allow access (both super admins and school admins can do this)
    if (user.clerkId) {
      try {
        await clerkService.unlockUser(user.clerkId);
      } catch (clerkError: any) {
        console.error(`Failed to unlock Clerk user ${user.clerkId}:`, clerkError);
        // Continue even if Clerk unlock fails - user is already reactivated in DB
        // User will be able to access the app since isActive is true
      }
    }

    // If reactivating a student, automatically reactivate their parents
    if (isStudent) {
      await this.handleStudentReactivation(userId);
    }
  }

  /**
   * Handle student reactivation:
   * - If the student is reactivated, automatically reactivate all linked parents
   */
  private async handleStudentReactivation(studentUserId: string): Promise<void> {
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

    // Reactivate all linked parents
    for (const parentUserId of parentUserIds) {
      const parent = await this.userRepository.findById(parentUserId);
      if (parent && !parent.isActive) {
        await this.userRepository.reactivate(parentUserId);
      }
    }
  }
}

