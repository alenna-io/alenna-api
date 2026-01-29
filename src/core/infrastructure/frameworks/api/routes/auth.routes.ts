import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { AuthController } from '../../../../presentation/controllers';
import {
  attachUserContext,
  validateBody,
} from '../middleware';
import { SetupPasswordDTO } from '../../../../application/dtos/auth';
import { asyncHandler } from '../../../../../utils';

const router: ExpressRouter = Router();
const authController = new AuthController(
  container.useCase.setupPasswordUseCase,
  container.useCase.getUserInfoUseCase
);

router.use(attachUserContext);

router.get(
  '/info',
  asyncHandler(authController.getUserInfo.bind(authController))
);

router.patch(
  '/setup-password',
  validateBody(SetupPasswordDTO),
  asyncHandler(authController.setupPassword.bind(authController))
);

export default router;
