import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { SchoolController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext, requireSchoolAdmin } from '../middleware';

const router: ExpressRouter = Router();
const schoolController = new SchoolController(
  container.useCase.getSchoolWithCurrentYearByUserIdUseCase
);

router.use(attachUserContext);
router.use(requireSchoolAdmin);

// Routes
router.get(
  '/',
  asyncHandler(schoolController.getSchoolWithCurrentYearByUserId.bind(schoolController))
);

export default router;