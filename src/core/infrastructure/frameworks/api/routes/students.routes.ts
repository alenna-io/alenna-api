import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { StudentController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext, requireSchoolAdmin } from '../middleware';

const router: ExpressRouter = Router();
const studentController = new StudentController(
  container.useCase.getEnrolledWithoutOpenProjectionUseCase
);

router.use(attachUserContext);
router.use(requireSchoolAdmin);

// Routes
router.get(
  '/projections/enrolled-without-open',
  asyncHandler(studentController.getEnrolledWithoutOpenProjection.bind(studentController))
);

export default router;