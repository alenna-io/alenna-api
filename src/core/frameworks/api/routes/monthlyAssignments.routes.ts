import { Router, type Router as ExpressRouter } from 'express';
import { MonthlyAssignmentController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission, requireAnyPermission } from '../middleware';

const router: ExpressRouter = Router({ mergeParams: true }); // mergeParams to access parent route params
const controller = new MonthlyAssignmentController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// All routes are under /api/v1/students/:studentId/projections/:projectionId/monthly-assignments

// Get all monthly assignments for a projection (read-only for parents/students, full for teachers/admins)
router.get('/', requireAnyPermission('projections.read', 'projections.readOwn'), controller.getMonthlyAssignments.bind(controller));

// Create a new monthly assignment (teachers/admins only)
router.post('/', requirePermission('projections.update'), controller.createMonthlyAssignment.bind(controller));

// Update monthly assignment name (teachers/admins only)
router.put('/:assignmentId', requirePermission('projections.update'), controller.updateMonthlyAssignment.bind(controller));

// Grade a monthly assignment (teachers/admins only)
router.post('/:assignmentId/grade', requirePermission('projections.update'), controller.gradeMonthlyAssignment.bind(controller));

// Delete a monthly assignment (teachers/admins only)
router.delete('/:assignmentId', requirePermission('projections.delete'), controller.deleteMonthlyAssignment.bind(controller));

export default router;

