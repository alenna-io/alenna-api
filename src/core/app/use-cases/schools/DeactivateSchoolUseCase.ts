import { ISchoolRepository, IUserRepository } from '../../../adapters_interface/repositories';
import { PrismaClient } from '@prisma/client';
import { clerkService } from '../../../frameworks/services/ClerkService';

const prisma = new PrismaClient();

export class DeactivateSchoolUseCase {
  constructor(
    private schoolRepository: ISchoolRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(schoolId: string): Promise<void> {
    const school = await this.schoolRepository.findById(schoolId);
    
    if (!school) {
      throw new Error('School not found');
    }

    if (!school.isActive) {
      throw new Error('School is already inactive');
    }

    // Deactivate the school
    await this.schoolRepository.deactivate(schoolId);

    // Automatically deactivate all active users assigned to this school
    const users = await prisma.user.findMany({
      where: {
        schoolId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Deactivate each user and lock them in Clerk
    for (const user of users) {
      await this.userRepository.deactivate(user.id);
      
      // Lock user in Clerk to prevent access
      if (user.clerkId) {
        try {
          await clerkService.lockUser(user.clerkId);
        } catch (clerkError: any) {
          console.error(`Failed to lock Clerk user ${user.clerkId}:`, clerkError);
          // Continue even if Clerk lock fails - user is already deactivated in DB
        }
      }
    }
  }
}

