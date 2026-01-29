import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { DailyGoalController } from '../../../../presentation/controllers/DailyGoalController';
import { attachUserContext, requireSchoolAdmin, validateBody } from '../middleware';
import { asyncHandler } from '../../../../../utils';
import {
  CreateDailyGoalInputSchema,
  AddNoteInputSchema,
  MarkCompleteInputSchema,
} from '../../../../application/dtos/daily-goals';

const router: ExpressRouter = Router({ mergeParams: true });
const dailyGoalController = new DailyGoalController(
  container.useCase.getDailyGoalsUseCase,
  container.useCase.createDailyGoalUseCase,
  container.useCase.addNoteToDailyGoalUseCase,
  container.useCase.markDailyGoalCompleteUseCase
);

router.use(attachUserContext);
router.use(requireSchoolAdmin);

router.get(
  '/',
  asyncHandler(dailyGoalController.getDailyGoalsHandler.bind(dailyGoalController))
);

router.post(
  '/',
  validateBody(CreateDailyGoalInputSchema),
  asyncHandler(dailyGoalController.createDailyGoalHandler.bind(dailyGoalController))
);

router.put(
  '/:id/note',
  validateBody(AddNoteInputSchema),
  asyncHandler(dailyGoalController.addNoteHandler.bind(dailyGoalController))
);

router.put(
  '/:id/complete',
  validateBody(MarkCompleteInputSchema),
  asyncHandler(dailyGoalController.markCompleteHandler.bind(dailyGoalController))
);

export default router;
