import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { CategoryController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext, requireSchoolAdmin } from '../middleware';

const router: ExpressRouter = Router();
const categoryController = new CategoryController(
  container.useCase.getCategoriesWithSubjectsUseCase
);

router.use(attachUserContext);
router.use(requireSchoolAdmin);

// Routes
router.get(
  '/',
  asyncHandler(categoryController.getCategoriesWithSubjects.bind(categoryController))
);

export default router;