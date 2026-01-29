import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { MonthlyAssignmentController } from '../../../../presentation/controllers';
import {
  attachUserContext,
  requireSchoolAdmin,
  validateBody,
} from '../middleware';
import {
  CreateMonthlyAssignmentTemplateDTO,
  UpdateMonthlyAssignmentTemplateDTO,
  CreateQuarterPercentageDTO,
  UpdateMonthlyAssignmentGradeDTO
} from '../../../../application/dtos/monthly-assignments';
import { asyncHandler } from '../../../../../utils';

const router: ExpressRouter = Router({ mergeParams: true });

const monthlyAssignmentController = new MonthlyAssignmentController(
  container.useCase.createMonthlyAssignmentTemplateUseCase,
  container.useCase.getMonthlyAssignmentsUseCase,
  container.useCase.updateMonthlyAssignmentTemplateUseCase,
  container.useCase.deleteMonthlyAssignmentTemplateUseCase,
  container.useCase.createQuarterPercentageUseCase,
  container.useCase.getProjectionMonthlyAssignmentsUseCase,
  container.useCase.updateMonthlyAssignmentGradeUseCase,
  container.useCase.markMonthlyAssignmentUngradedUseCase
);

router.use(attachUserContext);
router.use(requireSchoolAdmin);

router.get(
  '/school-year/:schoolYearId',
  asyncHandler(monthlyAssignmentController.getMonthlyAssignmentsHandler.bind(monthlyAssignmentController))
);

router.post(
  '/school-year/:schoolYearId/templates',
  validateBody(CreateMonthlyAssignmentTemplateDTO),
  asyncHandler(monthlyAssignmentController.createTemplateHandler.bind(monthlyAssignmentController))
);

router.patch(
  '/templates/:templateId',
  validateBody(UpdateMonthlyAssignmentTemplateDTO),
  asyncHandler(monthlyAssignmentController.updateTemplateHandler.bind(monthlyAssignmentController))
);

router.delete(
  '/templates/:templateId',
  asyncHandler(monthlyAssignmentController.deleteTemplateHandler.bind(monthlyAssignmentController))
);

router.post(
  '/school-year/:schoolYearId/percentages',
  validateBody(CreateQuarterPercentageDTO),
  asyncHandler(monthlyAssignmentController.createPercentageHandler.bind(monthlyAssignmentController))
);

router.get(
  '/projection/:projectionId',
  asyncHandler(monthlyAssignmentController.getProjectionMonthlyAssignmentsHandler.bind(monthlyAssignmentController))
);

router.patch(
  '/projection/:projectionId/assignments/:monthlyAssignmentId/grade',
  validateBody(UpdateMonthlyAssignmentGradeDTO),
  asyncHandler(monthlyAssignmentController.updateGradeHandler.bind(monthlyAssignmentController))
);

router.patch(
  '/projection/:projectionId/assignments/:monthlyAssignmentId/mark-ungraded',
  asyncHandler(monthlyAssignmentController.markUngradedHandler.bind(monthlyAssignmentController))
);

export default router;
