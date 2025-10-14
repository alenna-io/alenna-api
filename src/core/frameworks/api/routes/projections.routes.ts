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
router.get('/:id', projectionController.getProjection.bind(projectionController));
router.post('/', projectionController.createProjection.bind(projectionController));
router.put('/:id', projectionController.updateProjection.bind(projectionController));
router.delete('/:id', projectionController.deleteProjection.bind(projectionController));

export default router;

