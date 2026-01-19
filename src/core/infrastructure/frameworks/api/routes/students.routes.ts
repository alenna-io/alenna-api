import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { StudentController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();
const studentController = new StudentController(
  container.useCase.getEnrolledWithoutOpenProjectionUseCase
);

// Apply authentication middleware (MVP: hardcoded user)
router.use(attachUserContext);

// Routes
router.get(
  '/projections/enrolled-without-open',
  asyncHandler(studentController.getEnrolledWithoutOpenProjection.bind(studentController))
);

export default router;