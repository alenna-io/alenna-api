import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { SubjectController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext, requireSchoolAdmin } from '../middleware';

const router: ExpressRouter = Router();
const subjectController = new SubjectController(
  container.useCase.getSubjectAndNextLevelsWithPacesUseCase
);

router.use(attachUserContext);
router.use(requireSchoolAdmin);

// Routes
router.get(
  '/:subjectId/paces',
  asyncHandler(subjectController.getSubjectAndNextLevelsWithPaces.bind(subjectController))
);

export default router;