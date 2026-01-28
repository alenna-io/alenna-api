import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { DailyGoalController } from '../../../../presentation/controllers/DailyGoalController';
import { attachUserContext } from '../middleware';
import { asyncHandler } from '../../../../../utils';

const router: ExpressRouter = Router({ mergeParams: true });
const dailyGoalController = new DailyGoalController(
  container.useCase.getDailyGoalsUseCase
);

router.use(attachUserContext);

router.get(
  '/',
  asyncHandler(dailyGoalController.getDailyGoalsHandler.bind(dailyGoalController))
);

export default router;
