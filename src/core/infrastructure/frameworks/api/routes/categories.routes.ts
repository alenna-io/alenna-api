import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { CategoryController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';

const router: ExpressRouter = Router();
const categoryController = new CategoryController(
  container.useCase.getCategoriesWithSubjectsUseCase
);

// Routes
router.get(
  '/',
  asyncHandler(categoryController.getCategoriesWithSubjects.bind(categoryController))
);

export default router;