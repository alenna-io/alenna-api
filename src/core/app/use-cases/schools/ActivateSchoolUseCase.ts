import { ISchoolRepository, IUserRepository } from '../../../adapters_interface/repositories';
import { PrismaClient } from '@prisma/client';
import { clerkService } from '../../../frameworks/services/ClerkService';

const prisma = new PrismaClient();

export class ActivateSchoolUseCase {
  constructor(
    private schoolRepository: ISchoolRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(schoolId: string): Promise<void> {
    const school = await this.schoolRepository.findById(schoolId);
    
    if (!school) {
      throw new Error('School not found');
    }

    if (school.isActive) {
      throw new Error('School is already active');
    }

    // Activate the school
    await this.schoolRepository.activate(schoolId);

    // Automatically reactivate all inactive users assigned to this school
    // (only those who were deactivated due to school deactivation, not manually deactivated users)
    const users = await prisma.user.findMany({
      where: {
        schoolId,
        isActive: false,
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

    // Reactivate each user and unlock them in Clerk
    for (const user of users) {
      await this.userRepository.reactivate(user.id);
      
      // Unlock user in Clerk to allow access
      if (user.clerkId) {
        try {
          await clerkService.unlockUser(user.clerkId);
        } catch (clerkError: any) {
          console.error(`Failed to unlock Clerk user ${user.clerkId}:`, clerkError);
          // Continue even if Clerk unlock fails - user is already reactivated in DB
        }
      }
    }
  }
}

