import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { SchoolController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext, requireSchoolAdmin } from '../middleware';

const router: ExpressRouter = Router();
const schoolController = new SchoolController(
  container.useCase.getSchoolWithCurrentYearByUserIdUseCase,
  container.useCase.getCurrentWeekUseCase
);

router.use(attachUserContext);

// Routes
router.get(
  '/',
  requireSchoolAdmin,
  asyncHandler(schoolController.getSchoolWithCurrentYearByUserId.bind(schoolController))
);

router.get(
  '/current-week',
  asyncHandler(schoolController.getCurrentWeek.bind(schoolController))
);

export default router;