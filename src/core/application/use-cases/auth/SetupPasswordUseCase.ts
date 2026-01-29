import { IUserRepository } from '../../../domain/interfaces/repositories';
import { SetupPasswordInput } from '../../../application/dtos/auth';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { clerkService } from '../../../infrastructure/services/ClerkService';
import { logger } from '../../../../utils/logger';

export class SetupPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(userId: string, input: SetupPasswordInput): Promise<Result<void, DomainError>> {
    try {
      validateCuid(userId, 'User');

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Err(new ObjectNotFoundError('User', `User with ID ${userId} not found`));
      }

      if (!user.clerkId) {
        return Err(new InvalidEntityError('User', 'User does not have a Clerk ID'));
      }

      await clerkService.updateUserPassword(user.clerkId, input.password);
      logger.info(`[SetupPasswordUseCase] Password updated in Clerk for user ${userId}`);

      await this.userRepository.updateCreatedPassword(userId, true);
      logger.info(`[SetupPasswordUseCase] createdPassword set to true for user ${userId}`);

      return Ok(undefined);
    } catch (error) {
      logger.error('[SetupPasswordUseCase] Error setting up password:', error);

      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }

      if (error instanceof Error && 'statusCode' in error) {
        const statusCode = (error as any).statusCode;
        if (statusCode === 400 || statusCode === 422) {
          return Err(new InvalidEntityError('Password', error.message));
        }
      }

      throw error;
    }
  }
}
