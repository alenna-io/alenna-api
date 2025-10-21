import { Router, type Router as ExpressRouter } from 'express';
import { ProjectionController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation } from '../middleware';

const router: ExpressRouter = Router({ mergeParams: true }); // mergeParams to access studentId from parent route
const projectionController = new ProjectionController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// All routes are nested under /students/:studentId/projections
router.get('/', projectionController.getProjectionsByStudent.bind(projectionController));
router.get('/:id/detail', projectionController.getProjectionDetail.bind(projectionController)); // Must be before /:id
router.get('/:id', projectionController.getProjection.bind(projectionController));
router.post('/', projectionController.createProjection.bind(projectionController));
router.post('/:id/paces', projectionController.addPaceToProjection.bind(projectionController)); // Add PACE to projection
router.put('/:id', projectionController.updateProjection.bind(projectionController));
router.put('/:id/paces/:paceId', projectionController.updatePaceGrade.bind(projectionController)); // Update PACE grade
router.patch('/:id/paces/:paceId/move', projectionController.movePace.bind(projectionController)); // Move PACE to different week
router.delete('/:id', projectionController.deleteProjection.bind(projectionController));
router.delete('/:id/paces/:paceId', projectionController.removePaceFromProjection.bind(projectionController)); // Remove PACE

export default router;

