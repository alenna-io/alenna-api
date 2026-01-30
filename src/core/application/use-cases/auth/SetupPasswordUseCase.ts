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

  async execute(userId: string, clerkUserId: string, input: SetupPasswordInput): Promise<Result<void, DomainError>> {
    try {
      validateCuid(userId, 'User');

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Err(new ObjectNotFoundError('User', `User with ID ${userId} not found`));
      }

      // Use the clerkUserId from the request (from Clerk session) instead of from database
      // This is more reliable as it comes directly from the authenticated session
      await clerkService.updateUserPassword(clerkUserId, input.password);
      logger.info(`[SetupPasswordUseCase] Password updated in Clerk for user ${userId}`);

      await this.userRepository.updateCreatedPassword(userId, true);
      logger.info(`[SetupPasswordUseCase] createdPassword set to true for user ${userId}`);

      return Ok(undefined);
    } catch (error) {
      logger.error('[SetupPasswordUseCase] Error setting up password:', error);

      // Handle domain errors
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }

      // Handle Clerk API errors (they have statusCode property)
      if (error instanceof Error) {
        const statusCode = (error as any).statusCode;
        if (statusCode === 400 || statusCode === 422 || statusCode === 404) {
          return Err(new InvalidEntityError('Password', error.message || 'Failed to update password'));
        }

        // For other errors, check if it's a Clerk error format
        if ('errors' in error && Array.isArray((error as any).errors)) {
          const clerkErrors = (error as any).errors;
          if (clerkErrors.length > 0) {
            const firstError = clerkErrors[0];
            const errorMessage = firstError.longMessage || firstError.message || 'Failed to update password';
            return Err(new InvalidEntityError('Password', errorMessage));
          }
        }
      }

      // For any other error, wrap it in a DomainError
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return Err(new InvalidEntityError('Password', `Failed to set password: ${errorMessage}`));
    }
  }
}
