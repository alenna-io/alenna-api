import { IUserRepository } from '../../../domain/interfaces/repositories';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import {
  DomainError,
  InvalidEntityError,
  ObjectNotFoundError,
} from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';

export class GetUserInfoUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) { }

  async execute(userId: string): Promise<Result<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    language: string;
    schoolId: string;
    schoolName: string;
    schoolLogoUrl?: string;
    studentId: string | null;
    createdPassword: boolean;
    roles: Array<{
      id: string;
      name: string;
      displayName: string;
    }>;
  }, DomainError>> {
    try {
      validateCuid(userId, 'User');

      const userWithRelations = await this.userRepository.findByIdWithRelations(userId);
      if (!userWithRelations) {
        return Err(new ObjectNotFoundError('User', `User with ID ${userId} not found`));
      }

      const userInfo = {
        id: userWithRelations.id,
        email: userWithRelations.email,
        firstName: userWithRelations.firstName || undefined,
        lastName: userWithRelations.lastName || undefined,
        fullName: userWithRelations.firstName && userWithRelations.lastName
          ? `${userWithRelations.firstName} ${userWithRelations.lastName}`
          : userWithRelations.email,
        language: userWithRelations.language || 'es',
        schoolId: userWithRelations.schoolId,
        schoolName: userWithRelations.school?.name || '',
        schoolLogoUrl: userWithRelations.school?.logoUrl || undefined,
        studentId: userWithRelations.student?.id || null,
        createdPassword: userWithRelations.createdPassword,
        roles: userWithRelations.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          displayName: ur.role.name === 'SCHOOL_ADMIN' ? 'School Admin' : 'Student',
        })),
      };

      return Ok(userInfo);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
