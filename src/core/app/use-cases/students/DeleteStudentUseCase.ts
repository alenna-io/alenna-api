import { IStudentRepository } from '../../../adapters_interface/repositories';
import { PrismaClient } from '@prisma/client';
import { clerkService } from '../../../frameworks/services/ClerkService';

const prisma = new PrismaClient();

export class DeleteStudentUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(
    studentId: string,
    schoolId: string,
    currentUserRoles: string[]
  ): Promise<void> {
    // Check if student exists and belongs to school
    const student = await this.studentRepository.findById(studentId, schoolId);

    if (!student) {
      throw new Error('Student not found');
    }

    // Get the user associated with this student to access clerkId
    const studentUser = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            clerkId: true,
          },
        },
      },
    });

    if (!studentUser || !studentUser.user) {
      throw new Error('Student user not found');
    }

    const isSuperAdmin = currentUserRoles.includes('SUPERADMIN');
    const isSchoolAdmin = currentUserRoles.includes('SCHOOL_ADMIN');

    // Delete from Clerk before soft deleting (both super admins and school admins)
    if ((isSuperAdmin || isSchoolAdmin) && studentUser.user.clerkId) {
      try {
        // Delete user from Clerk
        await clerkService.deleteUser(studentUser.user.clerkId);
      } catch (clerkError: any) {
        console.error(`Failed to delete Clerk user ${studentUser.user.clerkId}:`, clerkError);
        throw new Error(`Failed to delete user from Clerk: ${clerkError.message || 'Unknown error'}`);
      }
    }

    // Soft delete student from database
    await this.studentRepository.delete(studentId, schoolId);

    // Soft delete the user and mark as inactive
    await prisma.user.update({
      where: { id: studentUser.user.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        clerkId: (isSuperAdmin || isSchoolAdmin) && studentUser.user.clerkId ? null : studentUser.user.clerkId,
      },
    });

    // Handle parent deletion if they have only one child
    await this.handleParentDeletion(studentId);
  }

  /**
   * Handle parent deletion:
   * - If a parent has only one child and that child is deleted, delete the parent as well
   */
  private async handleParentDeletion(studentId: string): Promise<void> {
    // Find the student record to get linked parents
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        userStudents: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!student) {
      return;
    }

    // Get all parents linked to this student
    const parentUserIds = student.userStudents.map((us) => us.userId);

    // For each parent, check if they have other students (not deleted)
    for (const parentUserId of parentUserIds) {
      const otherStudents = await prisma.userStudent.findMany({
        where: {
          userId: parentUserId,
          student: {
            id: { not: studentId }, // Exclude the student being deleted
            deletedAt: null, // Only count non-deleted students
          },
        },
      });

      // If parent has no other students, soft delete the parent user
      if (otherStudents.length === 0) {
        const parentUser = await prisma.user.findUnique({
          where: { id: parentUserId },
          select: { id: true, clerkId: true },
        });

        if (parentUser) {
          // Delete parent from Clerk if they have a clerkId
          if (parentUser.clerkId) {
            try {
              await clerkService.deleteUser(parentUser.clerkId);
            } catch (clerkError: any) {
              console.error(`Failed to delete parent Clerk user ${parentUser.clerkId}:`, clerkError);
              // Continue with soft delete even if Clerk deletion fails
            }
          }

          // Soft delete the parent user
          await prisma.user.update({
            where: { id: parentUserId },
            data: {
              deletedAt: new Date(),
              isActive: false,
              clerkId: null,
            },
          });
        }
      }
    }
  }
}

