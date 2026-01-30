import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { SetupPasswordUseCase, GetUserInfoUseCase } from '../../application/use-cases/auth';
import { SetupPasswordDTO } from '../../application/dtos/auth';
import { InvalidEntityError } from '../../domain/errors';

export class AuthController {
  constructor(
    private readonly setupPasswordUseCase: SetupPasswordUseCase = container.useCase.setupPasswordUseCase,
    private readonly getUserInfoUseCase: GetUserInfoUseCase = container.useCase.getUserInfoUseCase
  ) { }

  async getUserInfo(req: Request, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      throw new InvalidEntityError('User', 'User ID is required');
    }

    const result = await this.getUserInfoUseCase.execute(userId);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async setupPassword(req: Request, res: Response): Promise<Response> {
    const userId = req.userId;
    const clerkUserId = req.clerkUserId;
    if (!userId) {
      throw new InvalidEntityError('User', 'User ID is required');
    }
    if (!clerkUserId) {
      throw new InvalidEntityError('User', 'Clerk user ID is required');
    }

    const input = SetupPasswordDTO.parse(req.body);
    const result = await this.setupPasswordUseCase.execute(userId, clerkUserId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json({ message: 'Password set successfully' });
  }
}
