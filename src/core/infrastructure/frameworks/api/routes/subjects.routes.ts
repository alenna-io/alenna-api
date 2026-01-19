import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { SubjectController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();
const subjectController = new SubjectController(
  container.useCase.getSubjectAndNextLevelsWithPacesUseCase
);

// Apply authentication middleware (MVP: hardcoded user)
router.use(attachUserContext);

// Routes
router.get(
  '/:subjectId/paces',
  asyncHandler(subjectController.getSubjectAndNextLevelsWithPaces.bind(subjectController))
);

export default router;