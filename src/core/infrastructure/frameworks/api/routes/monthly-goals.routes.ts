import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { MonthlyGoalController } from '../../../../presentation/controllers';
import {
  attachUserContext,
  requireSchoolAdmin,
  validateBody,
} from '../middleware';
import {
  CreateMonthlyGoalTemplateDTO,
  UpdateMonthlyGoalTemplateDTO,
  CreateQuarterPercentageDTO,
  UpdateMonthlyGoalGradeDTO
} from '../../../../application/dtos/monthly-goals';
import { asyncHandler } from '../../../../../utils';

const router: ExpressRouter = Router({ mergeParams: true });

const monthlyGoalController = new MonthlyGoalController(
  container.useCase.createMonthlyGoalTemplateUseCase,
  container.useCase.getMonthlyGoalsUseCase,
  container.useCase.updateMonthlyGoalTemplateUseCase,
  container.useCase.deleteMonthlyGoalTemplateUseCase,
  container.useCase.createQuarterPercentageUseCase,
  container.useCase.getProjectionMonthlyGoalsUseCase,
  container.useCase.updateMonthlyGoalGradeUseCase,
  container.useCase.markMonthlyGoalUngradedUseCase
);

router.use(attachUserContext);
router.use(requireSchoolAdmin);

router.get(
  '/school-year/:schoolYearId',
  asyncHandler(monthlyGoalController.getMonthlyGoalsHandler.bind(monthlyGoalController))
);

router.post(
  '/school-year/:schoolYearId/templates',
  validateBody(CreateMonthlyGoalTemplateDTO),
  asyncHandler(monthlyGoalController.createTemplateHandler.bind(monthlyGoalController))
);

router.patch(
  '/templates/:templateId',
  validateBody(UpdateMonthlyGoalTemplateDTO),
  asyncHandler(monthlyGoalController.updateTemplateHandler.bind(monthlyGoalController))
);

router.delete(
  '/templates/:templateId',
  asyncHandler(monthlyGoalController.deleteTemplateHandler.bind(monthlyGoalController))
);

router.post(
  '/school-year/:schoolYearId/percentages',
  validateBody(CreateQuarterPercentageDTO),
  asyncHandler(monthlyGoalController.createPercentageHandler.bind(monthlyGoalController))
);

router.get(
  '/projection/:projectionId',
  asyncHandler(monthlyGoalController.getProjectionMonthlyGoalsHandler.bind(monthlyGoalController))
);

router.patch(
  '/projection/:projectionId/goals/:monthlyGoalId/grade',
  validateBody(UpdateMonthlyGoalGradeDTO),
  asyncHandler(monthlyGoalController.updateGradeHandler.bind(monthlyGoalController))
);

router.patch(
  '/projection/:projectionId/goals/:monthlyGoalId/mark-ungraded',
  asyncHandler(monthlyGoalController.markUngradedHandler.bind(monthlyGoalController))
);

export default router;
