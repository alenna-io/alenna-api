import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { SchoolController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();
const schoolController = new SchoolController(
  container.useCase.getSchoolWithCurrentYearByUserIdUseCase
);

// Apply authentication middleware (MVP: hardcoded user)
router.use(attachUserContext);

// Routes
router.get(
  '/',
  asyncHandler(schoolController.getSchoolWithCurrentYearByUserId.bind(schoolController))
);

export default router;