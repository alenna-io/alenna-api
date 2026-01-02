import { Router, type Router as ExpressRouter } from 'express';
import { ProjectionController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission, requireAnyPermission, cacheMiddleware } from '../middleware';

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
router.get('/', cacheMiddleware({ maxAge: 120, staleWhileRevalidate: 240 }), requireAnyPermission('projections.read', 'projections.readOwn'), projectionController.getProjectionsByStudent.bind(projectionController));
router.get('/:id/detail', cacheMiddleware({ maxAge: 30, staleWhileRevalidate: 60 }), requireAnyPermission('projections.read', 'projections.readOwn'), projectionController.getProjectionDetail.bind(projectionController)); // Must be before /:id
router.get('/:id', cacheMiddleware({ maxAge: 30, staleWhileRevalidate: 60 }), requireAnyPermission('projections.read', 'projections.readOwn'), projectionController.getProjection.bind(projectionController));
router.post('/', requirePermission('projections.create'), projectionController.createProjection.bind(projectionController));
router.post('/:id/paces', requirePermission('paces.create'), projectionController.addPaceToProjection.bind(projectionController)); // Add PACE to projection
router.put('/:id', requirePermission('projections.update'), projectionController.updateProjection.bind(projectionController));
router.put('/:id/paces/:paceId', requirePermission('paces.update'), projectionController.updatePaceGrade.bind(projectionController)); // Update PACE grade
router.patch('/:id/paces/:paceId/move', requirePermission('paces.move'), projectionController.movePace.bind(projectionController)); // Move PACE to different week
router.patch('/:id/paces/:paceId/incomplete', requirePermission('paces.update'), projectionController.markPaceIncomplete.bind(projectionController)); // Mark PACE as incomplete
router.delete('/:id', requirePermission('projections.delete'), projectionController.deleteProjection.bind(projectionController));
router.delete('/:id/paces/:paceId', requirePermission('paces.delete'), projectionController.removePaceFromProjection.bind(projectionController)); // Remove PACE

export default router;

