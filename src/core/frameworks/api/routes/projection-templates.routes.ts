import { Router, type Router as ExpressRouter } from 'express';
import { ProjectionTemplateController } from '../controllers/ProjectionTemplateController';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission } from '../middleware';

const router: ExpressRouter = Router();
const templateController = new ProjectionTemplateController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// Get all templates (optionally filtered by level)
router.get(
  '/',
  requirePermission('projections.read'),
  templateController.getTemplates.bind(templateController)
);

// Get default template for a specific level
router.get(
  '/level/:level',
  requirePermission('projections.read'),
  templateController.getTemplateByLevel.bind(templateController)
);

// Get template by ID
router.get(
  '/:id',
  requirePermission('projections.read'),
  templateController.getTemplateById.bind(templateController)
);

export default router;

