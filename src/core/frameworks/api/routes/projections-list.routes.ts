import { Router, type Router as ExpressRouter } from 'express';
import { ProjectionController } from '../controllers/ProjectionController';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission } from '../middleware';

const router: ExpressRouter = Router();
const projectionController = new ProjectionController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// Get all projections (teachers and school admins only)
router.get('/', requirePermission('projections.read'), projectionController.getAllProjections.bind(projectionController));

export default router;

