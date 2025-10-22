import { Router, type Router as ExpressRouter } from 'express';
import { DailyGoalsController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission, requireAnyPermission } from '../middleware';

const router: ExpressRouter = Router({ mergeParams: true }); // mergeParams to access studentId and projectionId from parent routes
const dailyGoalsController = new DailyGoalsController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// All routes are nested under /students/:studentId/projections/:projectionId/daily-goals
router.get('/', requireAnyPermission('projections.read', 'projections.readOwn'), dailyGoalsController.getDailyGoals.bind(dailyGoalsController));
router.post('/', requirePermission('projections.update'), dailyGoalsController.createDailyGoal.bind(dailyGoalsController));
router.put('/:goalId', requirePermission('projections.update'), dailyGoalsController.updateDailyGoal.bind(dailyGoalsController));
router.patch('/:goalId/completion', requirePermission('projections.update'), dailyGoalsController.updateDailyGoalCompletion.bind(dailyGoalsController));
router.patch('/:goalId/notes', requirePermission('projections.update'), dailyGoalsController.updateDailyGoalNotes.bind(dailyGoalsController));
router.post('/:goalId/notes', requirePermission('projections.update'), dailyGoalsController.addNoteToHistory.bind(dailyGoalsController));
router.get('/:goalId/notes', requireAnyPermission('projections.read', 'projections.readOwn'), dailyGoalsController.getNoteHistory.bind(dailyGoalsController));
router.delete('/:goalId', requirePermission('projections.update'), dailyGoalsController.deleteDailyGoal.bind(dailyGoalsController));

export default router;
