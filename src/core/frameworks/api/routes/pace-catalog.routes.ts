import { Router, type Router as ExpressRouter } from 'express';
import { PaceCatalogController } from '../controllers/PaceCatalogController';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation } from '../middleware';

const router: ExpressRouter = Router();
const paceCatalogController = new PaceCatalogController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// GET /pace-catalog?category=Math&level=L8
router.get('/', paceCatalogController.getPaceCatalog.bind(paceCatalogController));

export default router;

